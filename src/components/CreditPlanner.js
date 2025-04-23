import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const BLOCK_TYPE = "BLOCK";

// Predefined Courses by Category
const predefinedCoursesByCategory = {
  "Foundation courses": [
    { id: 1, name: "Algebra", credits: 4, type: "traditional" },
    { id: 2, name: "Calculus", credits: 3, type: "traditional" },
    { id: 3, name: "Mechanics", credits: 3, type: "traditional" },
    { id: 4, name: "Solid mechanics", credits: 3, type: "traditional" },
    { id: 5, name: "Thermodynamics", credits: 3, type: "traditional" },
    { id: 6, name: "Metrology/measurement", credits: 3, type: "traditional" },
    { id: 7, name: "Chemical equlibrium", credits: 3, type: "traditional" },
  ],
  "Materials and Manufacturing courses": [
    { id: 8, name: "Materials & Manufacturing", credits: 3, type: "project" },
    { id: 9, name: "Component Manufacturing & Manufacturing processes", credits: 3, type: "project" },
    { id: 10, name: "Materials & component characterisation", credits: 3, type: "project" },
    { id: 11, name: "Sustainable Materials & Process selection", credits: 3, type: "project" },
    { id: 12, name: "Diffusion & Phase Change", credits: 3, type: "project" },
    { id: 13, name: "Fluid mechanics", credits: 3, type: "project" },
  ],
  "Advanced Materials": [
    { id: 14, name: "Science of remelting", credits: 4, type: "mixed", traditionalPercentage: 50, projectPercentage: 50 },
    { id: 15, name: "Solidification", credits: 4, type: "mixed", traditionalPercentage: 50, projectPercentage: 50 },
    { id: 16, name: "Cast Metal components", credits: 4, type: "mixed", traditionalPercentage: 50, projectPercentage: 50 },
    { id: 17, name: "Polymer moulding components", credits: 4, type: "mixed", traditionalPercentage: 50, projectPercentage: 50 },
    { id: 18, name: "Surface technology/Corrosion", credits: 4, type: "mixed", traditionalPercentage: 50, projectPercentage: 50 },
  ],
  "Project/Group/Leadership courses": [
    { id: 19, name: "Mentor driven activities", credits: 4, type: "traditional" },
    { id: 20, name: "Project based learning skills", credits: 4, type: "project" },
  ],
  "General courses": [
    { id: 21, name: "Ethics", credits: 4, type: "traditional" },
    { id: 22, name: "Theory of Science", credits: 4, type: "project" },
    { id: 23, name: "Project Management & Leadership", credits: 4, type: "project" },
    { id: 24, name: "Entrepreneurship, Innovation processes & startups ", credits: 4, type: "project" },
    { id: 25, name: "Business economics", credits: 4, type: "project" },
  ],
  "Engineering tools/software/simulation tool courses": [
    { id: 26, name: "Programming (Python, Matlab)", credits: 4, type: "traditional" },
    { id: 27, name: "A.I. and applications", credits: 4, type: "project" },
    { id: 28, name: "Problem solving with Machine Learning", credits: 4, type: "traditional" },
    { id: 29, name: "C.A.D basics", credits: 4, type: "traditional" },
    { id: 30, name: "Simulation", credits: 4, type: "traditional" },
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
      id={`semester-${semesterIndex}`}
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
        onClick={() => saveSemester(semesterIndex)}
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
        link.click();
      });
    } else {
      alert("Semester block not found!");
    }
  };

  // Save the entire page as a PDF
  const savePageAsPDF = () => {
    const pageElement = document.body; // Capture the entire page
    if (pageElement) {
      html2canvas(pageElement, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Handle multi-page PDFs if content exceeds one page
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save("Credit_Planner.pdf");
      });
    } else {
      alert("Page content not found!");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Bachelor program development</h2>

        {/* Save Page as PDF Button */}
        <button
          onClick={savePageAsPDF}
          className="mb-4 bg-purple-500 text-white p-2 rounded"
        >
          Save Page as PDF
        </button>

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
          <input type="number" placeholder="Credits" min="1" step="0.1" value={credits} onChange={(e) => setCredits(parseFloat(e.target.value) || 0)} className="border p-2" />
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
