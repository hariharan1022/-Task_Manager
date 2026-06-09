import { Exam, Question } from "../models/Exam.js";
import { ExamAttempt } from "../models/ExamAttempt.js";
import { Result } from "../models/Result.js";
import { Enrollment } from "../models/Enrollment.js";
import { AssignmentSubmission } from "../models/AssignmentSubmission.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function listExams(req, res, next) {
  try {
    const { courseId } = req.params;
    const exams = await Exam.find({ course: courseId, isActive: true })
      .sort({ createdAt: 1 })
      .lean();
    const attempts = await ExamAttempt.find({
      user: req.user._id,
      exam: { $in: exams.map((e) => e._id) },
    }).lean();
    const attemptMap = Object.fromEntries(
      attempts.map((a) => [String(a.exam), a])
    );
    const items = exams.map((e) => {
      const a = attemptMap[String(e._id)];
      return {
        ...e,
        attempted: !!a,
        attemptStatus: a?.status || null,
        score: a?.convertedMarks || null,
        submittedAt: a?.submittedAt || null,
      };
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function startExam(req, res, next) {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam || !exam.isActive) {
      return res.status(404).json({ message: "Exam not found" });
    }
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: exam.course,
    });
    if (!enrollment) {
      return res.status(403).json({ message: "Enroll in the course first" });
    }

    let attempt = await ExamAttempt.findOne({
      user: req.user._id,
      exam: exam._id,
    });
    if (attempt && attempt.status === "completed") {
      return res.json({ attempt, message: "Already submitted" });
    }

    const questions = await Question.find({ exam: exam._id });
    if (questions.length === 0) {
      return res.status(400).json({ message: "No questions available" });
    }
    const questionList = exam.shuffleQuestions
      ? shuffle(questions)
      : questions;

    if (!attempt) {
      attempt = await ExamAttempt.create({
        user: req.user._id,
        exam: exam._id,
        course: exam.course,
        questionOrder: questionList.map((q) => q._id),
        totalQuestions: questionList.length,
        answers: questionList.map((q) => ({
          questionId: q._id,
          selected: -1,
          correct: false,
        })),
        status: "in-progress",
        startedAt: new Date(),
      });
    } else {
      await ExamAttempt.findByIdAndUpdate(attempt._id, {
        status: "in-progress",
        startedAt: new Date(),
        questionOrder: questionList.map((q) => q._id),
      });
    }

    const safeQuestions = questionList.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      marks: q.marks,
    }));

    res.json({
      attempt: {
        _id: attempt._id,
        startedAt: attempt.startedAt,
        duration: exam.duration,
        totalQuestions: attempt.totalQuestions,
        status: attempt.status,
      },
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        convertedMarks: exam.convertedMarks,
      },
      questions: safeQuestions,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitExam(req, res, next) {
  try {
    const { examId } = req.params;
    const { answers } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    const attempt = await ExamAttempt.findOne({
      user: req.user._id,
      exam: exam._id,
    });
    if (!attempt) return res.status(404).json({ message: "No active attempt" });
    if (attempt.status === "completed") {
      return res.json({ attempt, message: "Already submitted" });
    }

    const questionDocs = await Question.find({ exam: exam._id });
    const qMap = new Map(questionDocs.map((q) => [String(q._id), q]));

    let correctCount = 0;
    const finalAnswers = (answers || []).map((a) => {
      const q = qMap.get(String(a.questionId));
      const isCorrect = q ? q.correctAnswer === a.selected : false;
      if (isCorrect) correctCount += 1;
      return {
        questionId: a.questionId,
        selected: typeof a.selected === "number" ? a.selected : -1,
        correct: isCorrect,
      };
    });

    const totalQuestions = questionDocs.length || attempt.totalQuestions;
    const rawScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const converted = Number(((correctCount / Math.max(totalQuestions, 1)) * 50).toFixed(2));

    const submittedAt = new Date();
    const startedAt = new Date(attempt.startedAt);
    const timeSpent = isNaN(startedAt.getTime()) ? 0 : Math.floor((submittedAt - startedAt) / 1000);
    await ExamAttempt.findByIdAndUpdate(attempt._id, {
      answers: finalAnswers,
      correctCount,
      score: Number(rawScore.toFixed(2)),
      convertedMarks: converted,
      submittedAt,
      timeSpent,
      status: "completed",
    });
    attempt = await ExamAttempt.findById(attempt._id);

    await Result.findOneAndUpdate(
      { user: req.user._id, course: exam.course },
      { $set: { examMarks: converted } },
      { upsert: true, new: true }
    );

    res.json({
      attempt: {
        _id: attempt._id,
        correctCount,
        totalQuestions,
        score: attempt.score,
        convertedMarks: converted,
        timeSpent: attempt.timeSpent,
        status: attempt.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function myResults(req, res, next) {
  try {
    const results = await Result.find({ user: req.user._id })
      .populate("course", "title slug thumbnail category level")
      .sort({ updatedAt: -1 })
      .lean();

    const detailed = await Promise.all(
      results.map(async (r) => {
        const [latestExam, latestAssignment] = await Promise.all([
          ExamAttempt.findOne({
            user: req.user._id,
            course: r.course?._id,
            status: "completed",
          })
            .sort({ submittedAt: -1 })
            .lean(),
          AssignmentSubmission.findOne({
            user: req.user._id,
            course: r.course?._id,
            status: "graded",
          })
            .sort({ reviewedAt: -1 })
            .lean(),
        ]);
        return {
          ...r,
          latestExam,
          latestAssignment,
        };
      })
    );
    res.json({ items: detailed });
  } catch (err) {
    next(err);
  }
}

export async function courseResult(req, res, next) {
  try {
    const { courseId } = req.params;
    const result = await Result.findOne({
      user: req.user._id,
      course: courseId,
    })
      .populate("course", "title slug thumbnail")
      .lean();
    if (!result) return res.status(404).json({ message: "No result yet" });

    const [latestExam, latestAssignment] = await Promise.all([
      ExamAttempt.findOne({
        user: req.user._id,
        course: courseId,
        status: "completed",
      })
        .sort({ submittedAt: -1 })
        .lean(),
      AssignmentSubmission.findOne({
        user: req.user._id,
        course: courseId,
        status: "graded",
      })
        .sort({ reviewedAt: -1 })
        .lean(),
    ]);
    res.json({ result, latestExam, latestAssignment });
  } catch (err) {
    next(err);
  }
}

export async function adminListExams(req, res, next) {
  try {
    const { courseId } = req.query;
    const filter = {};
    if (courseId) filter.course = courseId;
    const items = await Exam.find(filter)
      .populate("course", "title slug")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateExam(req, res, next) {
  try {
    const exam = await Exam.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ exam });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateExam(req, res, next) {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ exam });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteExam(req, res, next) {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ message: "Exam removed" });
  } catch (err) {
    next(err);
  }
}

export async function adminListQuestions(req, res, next) {
  try {
    const { examId } = req.params;
    const questions = await Question.find({ exam: examId })
      .sort({ order: 1 })
      .lean();
    res.json({ items: questions });
  } catch (err) {
    next(err);
  }
}

export async function adminAddQuestion(req, res, next) {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    const count = await Question.countDocuments({ exam: examId });
    const question = await Question.create({
      ...req.body,
      exam: examId,
      order: count,
    });
    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
}

export async function adminBulkAddQuestions(req, res, next) {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    const { questions } = req.body;
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ message: "questions array required" });
    }
    const count = await Question.countDocuments({ exam: examId });
    const docs = questions.map((q, idx) => ({
      ...q,
      exam: examId,
      order: count + idx,
    }));
    const created = await Question.insertMany(docs);
    res.status(201).json({ count: created.length });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.questionId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.json({ question });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndDelete(req.params.questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.json({ message: "Question deleted" });
  } catch (err) {
    next(err);
  }
}
