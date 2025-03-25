import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const BLOCK_TYPE = "BLOCK";

// Course Block Component
const CourseBlock = ({ course }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: BLOCK_TYPE,
    item: { id: course.id, course },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-4 rounded-lg cursor-move m-2 transition-all duration-300 text-white ${
        course.type === "traditional" ? "bg-blue-500" : "bg-green-500"
      } ${isDragging ? "opacity-50" : ""}`}
      style={{
        width: `${course.credits * 40}px`, 
        whiteSpace: "normal", // Allow text to wrap
        wordWrap: "break-word", // Break long words if necessary
      }}
    >
      <div className="truncate">
        {course.name} ({course.credits} Credits)
      </div>
    </div>
  );
};

// Semester Drop Area
const SemesterBlock = ({ semesterIndex, courses, moveBlock }) => {
  const [, drop] = useDrop(() => ({
    accept: BLOCK_TYPE,
    drop: (item) => moveBlock(item.course, semesterIndex),
  }));

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const isOverLimit = totalCredits > 30;

  return (
    <div ref={drop} className={`border p-4 min-h-[100px] bg-black text-white ${isOverLimit ? "border-red-500" : ""}`} style={{ width: "100%" }}>
      <h4 className="font-bold">Semester {semesterIndex + 1} ({totalCredits}/30 Credits)</h4>
      {courses.map((course) => (
        <CourseBlock key={course.id} course={course} />
      ))}
      {isOverLimit && <p className="text-red-500">Credit limit exceeded!</p>}
    </div>
  );
};

// Main Credit Planner Component
const CreditPlanner = () => {
  const [courses, setCourses] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [credits, setCredits] = useState(1);
  const [type, setType] = useState("traditional");
  const [semesters, setSemesters] = useState([[], [], [], [], [], []]);

  const addCourse = () => {
    const newCourse = { id: courses.length, name: courseName, credits, type };
    setCourses([...courses, newCourse]);
    setCourseName("");
    setCredits(1);
    setType("traditional");
  };

  const moveBlock = (course, toSemester) => {
    setSemesters((prev) => {
      const newTotalCredits = prev[toSemester].reduce((sum, c) => sum + c.credits, 0) + course.credits;
      if (newTotalCredits > 30) {
        alert("Credit limit exceeded for this semester!");
        return prev;
      }
      return prev.map((sem, index) => {
        const filteredSem = sem.filter((c) => c.id !== course.id);
        return index === toSemester ? [...filteredSem, course] : filteredSem;
      });
    });
  };

  // Separate assigned and unassigned courses
  const assignedCourses = semesters.flat();
  const unassignedCourses = courses.filter(
    (course) => !assignedCourses.some((assignedCourse) => assignedCourse.id === course.id)
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Plan Your Courses</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="border p-2"
          />
          <input
            type="number"
            min="1"
            max="30"
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
            className="border p-2"
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2">
            <option value="traditional">Traditional</option>
            <option value="project">Project-Based</option>
          </select>
          <button onClick={addCourse} className="bg-blue-500 text-white p-2 rounded">Add Course</button>
        </div>
        <div className="flex gap-4 mb-4">
          {courses.map((course) => (
            <CourseBlock key={course.id} course={course} />
          ))}
        </div>
        <h3 className="text-lg font-bold mt-4">Semesters</h3>
        <div className="grid grid-cols-1 gap-4">
          {semesters.map((semester, index) => (
            <SemesterBlock key={index} semesterIndex={index} courses={semester} moveBlock={moveBlock} />
          ))}
        </div>

        {/* Assigned Courses List */}
        <div className="mt-4 w-full">
          <h4 className="font-bold mb-2">Assigned Courses</h4>
          <div className="flex flex-wrap">
            {assignedCourses.map((course) => (
              <CourseBlock key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Unassigned Courses List */}
        <div className="mt-4 w-full">
          <h4 className="font-bold mb-2">Unassigned Courses</h4>
          <div className="flex flex-wrap">
            {unassignedCourses.map((course) => (
              <CourseBlock key={course.id} course={course} />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default CreditPlanner;
