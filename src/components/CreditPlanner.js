import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import html2canvas from "html2canvas";

const BLOCK_TYPE = "BLOCK";

// Predefined Courses by Category
const predefinedCoursesByCategory = {
  "Category 1": [
    { id: 1, name: "Algebra", credits: 4, type: "traditional" },
    { id: 2, name: "Physics", credits: 3, type: "traditional" },
  ],
  "Category 2": [
    { id: 3, name: "Chemistry", credits: 3, type: "project" },
  ],
  "Category 3": [
    { id: 4, name: "Software Engineering", credits: 4, type: "mixed", traditionalPercentage: 50, projectPercentage: 50 },
  ],
  "Category 4": [
    { id: 5, name: "Data Structures", credits: 4, type: "traditional" },
    { id: 6, name: "Machine Learning", credits: 4, type: "project" },
  ],
};

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
          className={`w-full h-full flex items-center justify-center ${course.type === "traditional" ? "bg-blue-500" : "bg-green-500"}`}
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
    <div
      id={`semester-${semesterIndex}`} // Added id for each semester block
      ref={drop}
      className={`border p-4 min-h-[100px] bg-black text-white ${isOverLimit ? "border-red-500" : ""}`}
      style={{ width: "100%" }}
    >
      <h4 className="font-bold">
        Semester {semesterIndex + 1} ({totalCredits}/30 Credits)
      </h4>
      {courses.map((course) => (
        <CourseBlock key={course.id} course={course} removeCourse={removeCourse} />
      ))}
      {isOverLimit && <p className="text-red-500">Credit limit exceeded!</p>}
      <button
        onClick={() => saveSemester(semesterIndex)} // Save button triggers image save
        className="mt-2 bg-white text-black p-2 rounded"
      >
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

  // Function to handle adding a course
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

  // Function to copy from predefined courses
  const copyFromPredefined = (course) => {
    setCourseName(course.name);
    setCredits(course.credits);
    setType(course.type);
    if (course.type === "mixed") {
      setTraditionalPercentage(course.traditionalPercentage || 50);
      setProjectPercentage(course.projectPercentage || 50);
    }
  };

  // Move a course block to another semester
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

  // Remove a course
  const removeCourse = (id) => {
    setCourses(courses.filter((course) => course.id !== id));
    setSemesters((prev) => prev.map((sem) => sem.filter((course) => course.id !== id)));
  };

  // Save the semester as an image
  const saveSemester = (semesterIndex) => {
    const semesterElement = document.getElementById(`semester-${semesterIndex}`);
    if (semesterElement) {
      html2canvas(semesterElement, { backgroundColor: "#000", scale: 2 }).then((canvas) => {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `Semester_${semesterIndex + 1}.png`;
        link.click(); // Trigger download
      });
    } else {
      alert("Semester block not found!");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Bachelor program development</h2>

        {/* Categories with Predefined Courses */}
        <div className="w-full">
          {Object.keys(predefinedCoursesByCategory).map((category) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-bold">{category}</h3>
              <div className="flex gap-2 flex-wrap">
                {predefinedCoursesByCategory[category].map((course) => (
                  <button
                    key={course.id}
                    onClick={() => copyFromPredefined(course)}
                    className="bg-gray-300 text-black p-2 rounded"
                  >
                    {course.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Course Creation Form */}
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Course Name" value={courseName} onChange={(e) => setCourseName(e.target.value)} className="border p-2" />
          <input type="number" min="1" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="border p-2" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2">
            <option value="traditional">Traditional</option>
            <option value="project">Project</option>
            <option value="mixed">Mixed</option>
          </select>
          {type === "mixed" && (
            <div className="flex gap-2">
              <input type="number" min="0" max="100" value={traditionalPercentage} onChange={(e) => setTraditionalPercentage(Number(e.target.value))} className="border p-2" />
              <input type="number" min="0" max="100" value={projectPercentage} onChange={(e) => setProjectPercentage(Number(e.target.value))} className="border p-2" />
            </div>
          )}
          <button onClick={addCourse} className="bg-blue-500 text-white p-2 rounded">Add Course</button>
        </div>

        {/* Semester Blocks */}
        <div className="flex gap-4 flex-wrap justify-center">
          {semesters.map((courses, index) => (
            <SemesterBlock
              key={index}
              semesterIndex={index}
              courses={courses}
              moveBlock={moveBlock}
              removeCourse={removeCourse}
              saveSemester={saveSemester}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default CreditPlanner;
