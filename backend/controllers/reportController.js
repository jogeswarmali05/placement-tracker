const Report = require('../models/Report');
const Subject = require('../models/Subject');
const { ApiError, asyncHandler, pick } = require('../utils/helpers');

const FIELDS = ['subject', 'date', 'status', 'score', 'hoursSpent', 'remarks'];
const STATUS_PROGRESS = { 'Not Started': 0, 'In Progress': 50, Completed: 100 };
const round = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);

const clean = (data) => {
  if (data.score === '' || data.score === null) data.score = undefined;
  if (data.hoursSpent === '') data.hoursSpent = 0;
  return data;
};
const assertSubjectOwned = async (id, userId) => {
  if (!id || !(await Subject.exists({ _id: id, user: userId }))) throw new ApiError(400, 'Choose a valid subject');
};

exports.getReports = asyncHandler(async (req, res) => {
  const { subject, status, from, to } = req.query;
  const filter = { user: req.user._id };
  if (subject) filter.subject = subject;
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const reports = await Report.find(filter)
    .populate({ path: 'subject', select: 'name group', populate: { path: 'group', select: 'name color' } })
    .sort('-date -createdAt')
    .limit(500);
  res.json(reports);
});

exports.createReport = asyncHandler(async (req, res) => {
  const data = clean(pick(req.body, FIELDS));
  await assertSubjectOwned(data.subject, req.user._id);
  res.status(201).json(await Report.create({ ...data, user: req.user._id }));
});

exports.updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) throw new ApiError(404, 'Report not found');
  const data = clean(pick(req.body, FIELDS));
  if (data.subject) await assertSubjectOwned(data.subject, req.user._id);
  Object.assign(report, data);
  res.json(await report.save());
});

exports.deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!report) throw new ApiError(404, 'Report not found');
  res.json({ message: 'Report deleted' });
});

// Aggregated analytics for the dashboard and reports pages
exports.getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [subjects, perSubject, perDay] = await Promise.all([
    Subject.find({ user: userId }).populate('group', 'name color').lean(),
    Report.aggregate([
      { $match: { user: userId } },
      { $sort: { date: 1, createdAt: 1 } },
      {
        $group: {
          _id: '$subject',
          hours: { $sum: '$hoursSpent' },
          sessions: { $sum: 1 },
          avgScore: { $avg: '$score' },
          status: { $last: '$status' },
          lastActivity: { $max: '$date' },
        },
      },
    ]),
    Report.aggregate([
      { $match: { user: userId, date: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, hours: { $sum: '$hoursSpent' } } },
    ]),
  ]);

  const stats = new Map(perSubject.map((s) => [String(s._id), s]));
  const rows = subjects
    .filter((s) => s.group)
    .map((s) => {
      const st = stats.get(String(s._id));
      const status = st ? st.status : 'Not Started';
      return {
        _id: s._id,
        name: s.name,
        groupId: s.group._id,
        groupName: s.group.name,
        color: s.group.color,
        hours: round(st?.hours || 0),
        sessions: st?.sessions || 0,
        avgScore: round(st?.avgScore),
        status,
        progress: STATUS_PROGRESS[status],
        lastActivity: st?.lastActivity || null,
      };
    });

  const groupMap = {};
  rows.forEach((r) => {
    const g = (groupMap[r.groupId] = groupMap[r.groupId] || {
      _id: r.groupId, name: r.groupName, color: r.color, subjectCount: 0, hours: 0, progressSum: 0, scores: [],
    });
    g.subjectCount += 1;
    g.hours += r.hours;
    g.progressSum += r.progress;
    if (r.avgScore !== null) g.scores.push(r.avgScore);
  });
  const groups = Object.values(groupMap).map((g) => ({
    _id: g._id, name: g.name, color: g.color, subjectCount: g.subjectCount,
    hours: round(g.hours),
    progress: Math.round(g.progressSum / g.subjectCount),
    avgScore: g.scores.length ? round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length) : null,
  }));

  const scored = rows.filter((r) => r.avgScore !== null);
  const dayMap = new Map(perDay.map((d) => [d._id, d.hours]));
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, label: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: round(dayMap.get(key) || 0) };
  });

  res.json({
    overview: {
      subjects: rows.length,
      completed: rows.filter((r) => r.status === 'Completed').length,
      totalHours: round(rows.reduce((a, r) => a + r.hours, 0)),
      avgScore: scored.length ? round(scored.reduce((a, r) => a + r.avgScore, 0) / scored.length) : null,
      overallProgress: rows.length ? Math.round(rows.reduce((a, r) => a + r.progress, 0) / rows.length) : 0,
    },
    groups,
    subjects: rows,
    strengths: scored.filter((r) => r.avgScore >= 75).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5),
    weakAreas: scored.filter((r) => r.avgScore < 60).sort((a, b) => a.avgScore - b.avgScore).slice(0, 5),
    notStarted: rows.filter((r) => r.sessions === 0).slice(0, 8),
    weekly,
  });
});
