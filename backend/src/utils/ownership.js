const { Course, Assessment, Grade, AttendanceRecord } = require('../models');
const ApiError = require('./ApiError');

/** Returns the course only if it belongs to the student; otherwise 404 (no existence leak). */
async function ownedCourse(courseId, studentId) {
  const course = await Course.findOne({ where: { course_id: courseId, student_id: studentId } });
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
}

async function ownedChild(Model, pk, id, studentId, label) {
  const row = await Model.findOne({
    where: { [pk]: id },
    include: [{ model: Course, where: { student_id: studentId }, required: true }],
  });
  if (!row) throw new ApiError(404, `${label} not found`);
  return row;
}
const ownedAssessment = (id, sid) => ownedChild(Assessment, 'assessment_id', id, sid, 'Assessment');
const ownedGrade = (id, sid) => ownedChild(Grade, 'grade_id', id, sid, 'Grade');
const ownedAttendance = (id, sid) => ownedChild(AttendanceRecord, 'record_id', id, sid, 'Attendance record');

module.exports = { ownedCourse, ownedAssessment, ownedGrade, ownedAttendance };
