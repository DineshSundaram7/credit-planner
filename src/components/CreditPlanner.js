import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import html2canvas from "html2canvas";

const BLOCK_TYPE = "BLOCK";

// Course Block Component
const CourseBlock = ({ course, removeCourse }) => {
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
      className={`p-4 rounded-lg cursor-move m-2 transition-all duration-300 text-white relative ${isDragging ? "opacity-50" : ""}`}
      style={{
        width: `${course.credits * 40}px`,
        display: "flex",
        height: "100px",
      }}
    >
      {course.type === "mixed" ? (
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
          <div
            style={{
              width: `${course.traditionalPercentage}%`,
              backgroundColor: "green",
              height: "100%",
            }}
          />
          <div
            style={{
              width: `${course.projectPercentage}%`,
              backgroundColor: "blue",
              height: "100%",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
            {course.name} ({course.credits} Credits)
          </div>
        </div>
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center ${
            course.type === "traditional" ? "bg-blue-500" : "bg-green-500"
          }`}
        >
          {course.name} ({course.credits} Credits)
        </div>
      )}
      <button
        onClick={() => removeCourse(course.id)}
        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs"
      >
        X
      </button>
    </div>
  );
};

// Semester Drop Area
const SemesterBlock = ({ semesterIndex, courses, moveBlock, removeCourse, saveSemester }) => {
  const [, drop] = useDrop(() => ({
    accept: BLOCK_TYPE,
    drop: (item) => moveBlock(item.course, semesterIndex),
  }));

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const isOverLimit = totalCredits > 30;

  return (
    <div ref={drop} className={`border p-4 min-h-[100px] bg-black text-white ${isOverLimit ? "border-red-500" : ""}`} style={{ width: "100%" }}>
      <h4 className="font-bold">
        Semester {semesterIndex + 1} ({totalCredits}/30 Credits)
      </h4>
      {courses.map((course) => (
        <CourseBlock key={course.id} course={course} removeCourse={removeCourse} />
      ))}
      {isOverLimit && <p className="text-red-500">Credit limit exceeded!</p>}
      <button onClick={() => saveSemester(semesterIndex)} className="mt-2 bg-blue-500 text-white p-2 rounded">
        Save as Image
      </button>
    </div>
  );
};

// Main Credit Planner Component
const CreditPlanner = () => {
  const [courses, setCourses] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [credits, setCredits] = useState(1);
  const [type, setType] = useState("traditional");
  const [traditionalPercentage, setTraditionalPercentage] = useState(50);
  const [projectPercentage, setProjectPercentage] = useState(50);
  const [semesters, setSemesters] = useState([[], [], [], [], [], []]);

  const addCourse = () => {
    if (type === "mixed" && traditionalPercentage + projectPercentage !== 100) {
      alert("The percentages for traditional and project-based must add up to 100.");
      return;
    }

    let newCourse = {
      id: courses.length,
      name: courseName,
      credits,
      type,
      traditionalPercentage: type === "mixed" ? traditionalPercentage : 0,
      projectPercentage: type === "mixed" ? projectPercentage : 0,
    };

    setCourses([...courses, newCourse]);
    setSemesters((prev) => {
      const updatedSemesters = [...prev];
      updatedSemesters[0] = [...updatedSemesters[0], newCourse];
      return updatedSemesters;
    });
    setCourseName("");
    setCredits(1);
    setType("traditional");
    setTraditionalPercentage(50);
    setProjectPercentage(50);
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

  const removeCourse = (id) => {
    setCourses(courses.filter((course) => course.id !== id));
    setSemesters((prev) => prev.map((sem) => sem.filter((course) => course.id !== id)));
  };

  const saveSemester = (semesterIndex) => {
    const semesterDivs = document.getElementsByClassName("border p-4 min-h-[100px] bg-black text-white");
    if (semesterDivs[semesterIndex]) {
      html2canvas(semesterDivs[semesterIndex]).then((canvas) => {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/jpeg");
        link.download = `Semester_${semesterIndex + 1}.jpg`;
        link.click();
      });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Plan Your Courses</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Course Name" value={courseName} onChange={(e) => setCourseName(e.target.value)} className="border p-2" />
          <input type="number" min="1" max="30" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="border p-2" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2">
            <option value="traditional">Traditional</option>
            <option value="project">Project-Based</option>
            <option value="mixed">Mixed</option>
          </select>
          {type === "mixed" && (
            <>
              <input type="number" value={traditionalPercentage} onChange={(e) => setTraditionalPercentage(Number(e.target.value))} min="0" max="100" className="border p-2" />
              <input type="number" value={projectPercentage} onChange={(e) => setProjectPercentage(Number(e.target.value))} min="0" max="100" className="border p-2" />
            </>
          )}
          <button onClick={addCourse} className="bg-blue-500 text-white p-2 rounded">
            Add Course
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {semesters.map((semester, index) => (
            <SemesterBlock key={index} semesterIndex={index} courses={semester} moveBlock={moveBlock} removeCourse={removeCourse} saveSemester={saveSemester} />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default CreditPlanner;
