function yt(idOrUrl) {
  if (!idOrUrl) return "";
  if (/^https?:\/\//.test(idOrUrl)) return idOrUrl;
  return `https://www.youtube.com/watch?v=${idOrUrl}`;
}

const sampleLesson = (title, videoId, duration = 600) => ({
  title,
  description: `In this lesson, you will learn about ${title.toLowerCase()}.`,
  videoType: "youtube",
  videoUrl: yt(videoId),
  duration,
  resources: [
    {
      title: `${title} - Notes (PDF)`,
      fileUrl: "#",
      type: "pdf",
    },
  ],
  isPreview: false,
});

function buildCourse({
  title,
  slug,
  category,
  level,
  duration,
  shortDescription,
  description,
  thumbnail,
  tags,
  learningObjectives,
  videoId,
  isFeatured = true,
}) {
  return {
    title,
    slug,
    category,
    level,
    duration,
    shortDescription,
    description,
    thumbnail,
    tags,
    learningObjectives,
    requirements: ["Basic computer literacy", "No prior coding needed"],
    instructor: "Skyrovix Academy",
    isFeatured,
    video_url: yt(videoId),
    modules: [
      {
        title: `Getting Started with ${title}`,
        description: `Begin your ${title} journey with the core concepts and setup.`,
        order: 0,
        lessons: [
          sampleLesson("Introduction & Course Overview", videoId, 480),
          sampleLesson("Setting Up Your Environment", videoId, 600),
        ],
      },
      {
        title: `Core ${title} Concepts`,
        description: `Hands-on walkthrough of the key ideas behind ${title}.`,
        order: 1,
        lessons: [
          sampleLesson("Core Concepts Explained", videoId, 900),
          sampleLesson("Practical Walkthrough", videoId, 900),
        ],
      },
      {
        title: `Practice & Next Steps`,
        description: `Reinforce your learning and find out where to go next.`,
        order: 2,
        lessons: [
          sampleLesson("Practice Exercises", videoId, 600),
          sampleLesson("Summary & Next Steps", videoId, 420),
        ],
      },
    ],
  };
}

const courses = [
  buildCourse({
    title: "Python for Beginners",
    slug: "python-for-beginners",
    category: "Programming",
    level: "Beginner",
    duration: "6 weeks",
    shortDescription:
      "Start your Python journey — syntax, data types, control flow, functions, and first projects.",
    description:
      "A beginner-friendly Python course that takes you from absolute zero to writing real programs. Learn variables, data types, conditionals, loops, functions, lists, dictionaries, and build small projects along the way.",
    thumbnail:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
    tags: ["python", "programming", "beginner"],
    learningObjectives: [
      "Understand Python syntax and core data types",
      "Use conditionals, loops, and functions",
      "Work with lists, tuples, and dictionaries",
      "Build small beginner-friendly projects",
    ],
    videoId: "m67-bOpOoPU",
  }),
  buildCourse({
    title: "Python Zero to Hero",
    slug: "python-zero-to-hero",
    category: "Programming",
    level: "Intermediate",
    duration: "10 weeks",
    shortDescription:
      "Go from Python basics to advanced — OOP, modules, APIs, file handling, and real projects.",
    description:
      "A complete Python path for serious learners. Master object-oriented programming, modules and packages, error handling, file I/O, working with APIs, virtual environments, and ship real-world projects.",
    thumbnail:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
    tags: ["python", "oop", "intermediate", "apis"],
    learningObjectives: [
      "Master object-oriented programming in Python",
      "Organize code with modules, packages, and venvs",
      "Consume REST APIs and handle JSON",
      "Handle files, exceptions, and logging",
      "Build real, end-to-end Python projects",
    ],
    videoId: "HAxm8n9QY50",
  }),
  buildCourse({
    title: "Machine Learning",
    slug: "machine-learning",
    category: "Data Science",
    level: "Intermediate",
    duration: "10 weeks",
    shortDescription:
      "Learn ML fundamentals — supervised and unsupervised learning, model evaluation, and pipelines.",
    description:
      "A practical introduction to machine learning. Cover linear and logistic regression, decision trees, k-NN, SVMs, clustering, dimensionality reduction, model evaluation, and end-to-end ML pipelines with scikit-learn.",
    thumbnail:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
    tags: ["machine-learning", "python", "scikit-learn", "data-science"],
    learningObjectives: [
      "Understand supervised and unsupervised learning",
      "Build and evaluate regression and classification models",
      "Apply clustering and dimensionality reduction techniques",
      "Build end-to-end ML pipelines with scikit-learn",
    ],
    videoId: "rn8Yp6otAh8",
  }),
  buildCourse({
    title: "Deep Learning",
    slug: "deep-learning",
    category: "Data Science",
    level: "Advanced",
    duration: "12 weeks",
    shortDescription:
      "Dive into deep learning — neural networks, CNNs, RNNs, and modern architectures with TensorFlow/PyTorch.",
    description:
      "A comprehensive deep learning course covering perceptrons, backpropagation, optimization, CNNs for vision, RNNs/LSTMs for sequences, transfer learning, and hands-on projects using TensorFlow and PyTorch.",
    thumbnail:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
    tags: ["deep-learning", "neural-networks", "tensorflow", "pytorch"],
    learningObjectives: [
      "Understand neural network fundamentals and backpropagation",
      "Build CNNs for image classification",
      "Build RNNs/LSTMs for sequence data",
      "Apply transfer learning to real projects",
    ],
    videoId: "6fzjJ690tpQ",
  }),
  buildCourse({
    title: "HTML5",
    slug: "html5",
    category: "Web Development",
    level: "Beginner",
    duration: "4 weeks",
    shortDescription:
      "Learn HTML5 from the ground up — semantic markup, forms, media, and accessibility.",
    description:
      "Master modern HTML5: semantic elements, forms and validation, audio and video, canvas, and accessibility best practices. Build a strong foundation for any web development career.",
    thumbnail:
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800",
    tags: ["html", "html5", "web-development", "beginner"],
    learningObjectives: [
      "Write semantic HTML5 markup",
      "Build accessible forms with validation",
      "Embed audio, video, and media elements",
      "Apply accessibility best practices",
    ],
    videoId: "Ow_DLQ1oWWg",
  }),
  buildCourse({
    title: "CSS3",
    slug: "css3",
    category: "Web Development",
    level: "Beginner",
    duration: "5 weeks",
    shortDescription:
      "Style beautiful, responsive websites with modern CSS3 — Flexbox, Grid, animations, and more.",
    description:
      "Learn modern CSS3: selectors, the box model, Flexbox, Grid, responsive design, transitions, animations, custom properties, and architecture patterns for maintainable stylesheets.",
    thumbnail:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800",
    tags: ["css", "css3", "web-development", "responsive-design"],
    learningObjectives: [
      "Master Flexbox and CSS Grid layouts",
      "Build responsive, mobile-first designs",
      "Use transitions, animations, and custom properties",
      "Organize CSS for scalable projects",
    ],
    videoId: "hjtxTSHHYCQ",
  }),
  buildCourse({
    title: "Mastering JavaScript",
    slug: "mastering-javascript",
    category: "Web Development",
    level: "Intermediate",
    duration: "10 weeks",
    shortDescription:
      "Master modern JavaScript — ES6+, async/await, modules, classes, and design patterns.",
    description:
      "A deep dive into modern JavaScript: ES6+ syntax, closures, prototypes, async patterns, modules, classes, error handling, and the patterns that show up in real production codebases.",
    thumbnail:
      "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
    tags: ["javascript", "es6", "async", "intermediate"],
    learningObjectives: [
      "Write modern ES6+ JavaScript fluently",
      "Master closures, prototypes, and the event loop",
      "Use async/await and Promises effectively",
      "Apply common design patterns in JavaScript",
    ],
    videoId: "8FhN2-aahVE",
  }),
  buildCourse({
    title: "JavaScript for Beginners",
    slug: "javascript-for-beginners",
    category: "Web Development",
    level: "Beginner",
    duration: "5 weeks",
    shortDescription:
      "Start programming with JavaScript — variables, functions, DOM, and your first interactive pages.",
    description:
      "An approachable JavaScript course for absolute beginners. Cover variables, types, conditionals, loops, functions, arrays, objects, the DOM, event handling, and your first small interactive projects.",
    thumbnail:
      "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
    tags: ["javascript", "beginner", "dom", "web-development"],
    learningObjectives: [
      "Understand JavaScript syntax and core data types",
      "Use functions, arrays, and objects",
      "Manipulate the DOM and handle events",
      "Build small interactive beginner projects",
    ],
    videoId: "poo0BXryffI",
  }),
  buildCourse({
    title: "Flutter Mobile Development",
    slug: "flutter-mobile-development",
    category: "Mobile Development",
    level: "Intermediate",
    duration: "10 weeks",
    shortDescription:
      "Build cross-platform mobile apps with Flutter and Dart — widgets, state, navigation, and Material Design 3.",
    description:
      "A hands-on Flutter course: Dart fundamentals, widgets, layouts, state management, navigation, networking, and Material Design 3. Build and deploy cross-platform mobile apps for iOS and Android.",
    thumbnail:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
    tags: ["flutter", "dart", "mobile", "material-design"],
    learningObjectives: [
      "Master Dart language fundamentals",
      "Build UIs with Flutter widgets and layouts",
      "Manage state and navigation in real apps",
      "Apply Material Design 3 to mobile apps",
    ],
    videoId: "Vp4uaNbtNCg",
  }),
  buildCourse({
    title: "Tailwind CSS",
    slug: "tailwind-css",
    category: "Web Development",
    level: "Beginner",
    duration: "4 weeks",
    shortDescription:
      "Design beautiful, responsive UIs faster with Tailwind CSS — utility-first workflow and best practices.",
    description:
      "Master Tailwind CSS: utility-first thinking, responsive design, customization, dark mode, components, and how to integrate Tailwind into React, Vite, and Next.js projects.",
    thumbnail:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800",
    tags: ["tailwind", "css", "frontend", "utility-first"],
    learningObjectives: [
      "Build UIs with Tailwind's utility-first approach",
      "Use responsive variants and dark mode",
      "Customize Tailwind config for your project",
      "Integrate Tailwind with React/Vite/Next.js",
    ],
    videoId: "2T0D3MLOenQ",
  }),
  buildCourse({
    title: "Angular",
    slug: "angular",
    category: "Web Development",
    level: "Intermediate",
    duration: "10 weeks",
    shortDescription:
      "Build scalable single-page apps with Angular — components, services, RxJS, routing, and forms.",
    description:
      "A complete Angular course: TypeScript fundamentals, components, services, dependency injection, RxJS, routing, forms (template-driven and reactive), and best practices for production-grade SPAs.",
    thumbnail:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    tags: ["angular", "typescript", "spa", "rxjs"],
    learningObjectives: [
      "Build Angular apps with components and services",
      "Use RxJS for reactive data flows",
      "Implement routing and navigation",
      "Handle template-driven and reactive forms",
    ],
    videoId: "D1RHBY0unzA",
  }),
  buildCourse({
    title: "Figma for UI/UX Design",
    slug: "figma-uiux",
    category: "Design",
    level: "Beginner",
    duration: "6 weeks",
    shortDescription:
      "Design beautiful interfaces and prototypes in Figma — components, auto-layout, and design systems.",
    description:
      "A practical Figma course for aspiring UI/UX designers. Cover frames, components, variants, auto-layout, prototyping, design tokens, and building a small design system from scratch.",
    thumbnail:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800",
    tags: ["figma", "ui", "ux", "design-systems"],
    learningObjectives: [
      "Navigate Figma with confidence",
      "Use components, variants, and auto-layout",
      "Build interactive prototypes",
      "Create a small reusable design system",
    ],
    videoId: "NPhm4ObcWhE",
  }),
  buildCourse({
    title: "React JS",
    slug: "react-js",
    category: "Web Development",
    level: "Intermediate",
    duration: "10 weeks",
    shortDescription:
      "Build modern UIs with React — components, hooks, state, routing, and real apps.",
    description:
      "A practical React course: JSX, components, props, state, hooks (useState, useEffect, useContext), routing, forms, and the patterns that show up in production React apps.",
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    tags: ["react", "javascript", "frontend", "hooks"],
    learningObjectives: [
      "Build React components and manage state",
      "Use core hooks (useState, useEffect, useContext)",
      "Implement client-side routing",
      "Build small production-style React apps",
    ],
    videoId: "_Tw87kvxOKs",
  }),
  buildCourse({
    title: "Java Programming",
    slug: "java-programming",
    category: "Programming",
    level: "Beginner",
    duration: "8 weeks",
    shortDescription:
      "Learn Java from scratch — OOP, collections, exceptions, streams, and modern Java features.",
    description:
      "A complete beginner Java course: syntax, object-oriented programming, collections, exception handling, file I/O, streams, lambdas, and a tour of modern Java features used in real codebases.",
    thumbnail:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    tags: ["java", "oop", "programming", "beginner"],
    learningObjectives: [
      "Write clean Java syntax and OOP code",
      "Use collections, exceptions, and generics",
      "Apply streams and lambdas",
      "Build small console and GUI Java apps",
    ],
    videoId: "kGxSyqKbzsc",
  }),
  buildCourse({
    title: "SQL & Relational Databases",
    slug: "sql",
    category: "Database",
    level: "Beginner",
    duration: "5 weeks",
    shortDescription:
      "Master SQL — queries, joins, aggregations, indexes, and database design fundamentals.",
    description:
      "A practical SQL course: SELECT, INSERT/UPDATE/DELETE, joins, aggregations, subqueries, indexes, transactions, and database design with normalization. Works with MySQL/PostgreSQL.",
    thumbnail:
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800",
    tags: ["sql", "mysql", "postgresql", "database"],
    learningObjectives: [
      "Write SQL SELECT, INSERT, UPDATE, DELETE",
      "Use joins, aggregations, and subqueries",
      "Design normalized schemas and use indexes",
      "Work with transactions and constraints",
    ],
    videoId: "JtaOmwnR6AM",
  }),
  buildCourse({
    title: "Big Data",
    slug: "big-data",
    category: "Data Science",
    level: "Intermediate",
    duration: "8 weeks",
    shortDescription:
      "Get started with Big Data — Hadoop, Spark, distributed systems, and large-scale data pipelines.",
    description:
      "An introduction to Big Data: concepts, Hadoop ecosystem, Apache Spark, distributed storage, data pipelines, and processing large datasets in the cloud.",
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    tags: ["big-data", "hadoop", "spark", "data-engineering"],
    learningObjectives: [
      "Understand Big Data concepts and the Hadoop ecosystem",
      "Build data pipelines with Apache Spark",
      "Process large datasets in distributed environments",
      "Apply Big Data tools to real-world problems",
    ],
    videoId: "TVNVQP7L9IE",
  }),
  buildCourse({
    title: "Data Science",
    slug: "data-science",
    category: "Data Science",
    level: "Intermediate",
    duration: "10 weeks",
    shortDescription:
      "Become a data scientist — Python, Pandas, statistics, visualization, and a primer on ML.",
    description:
      "A practical data science course: NumPy, Pandas, data cleaning, exploratory data analysis, statistics, visualization with Matplotlib and Seaborn, and a primer on machine learning workflows.",
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    tags: ["data-science", "python", "pandas", "visualization"],
    learningObjectives: [
      "Work with data using NumPy and Pandas",
      "Perform exploratory data analysis and visualization",
      "Apply statistics for data-driven decisions",
      "Build an end-to-end data science mini-project",
    ],
    videoId: "k6HOBjkUkE4",
  }),
];

export default courses;
