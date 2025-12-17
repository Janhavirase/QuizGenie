export const prebuiltQuizzes = {
  everyone: [
    {
      id: 1,
      title: "Natural landmarks around the world",
      author: "Wikipedia",
      image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&q=80",
      category: "Geography",
      questions: [
        { questionText: "What is the highest mountain above sea level in the world?", options: ["K2", "Mount Everest", "Kilimanjaro", "Denali"], correctAnswer: "Mount Everest" },
        { questionText: "Where is the Great Barrier Reef located?", options: ["Australia", "Belize", "Indonesia", "Florida"], correctAnswer: "Australia" },
        { questionText: "Which waterfall is the highest in the world?", options: ["Angel Falls", "Niagara Falls", "Victoria Falls", "Iguazu Falls"], correctAnswer: "Angel Falls" },
        { questionText: "The Grand Canyon was carved by which river?", options: ["Colorado River", "Mississippi River", "Amazon River", "Nile River"], correctAnswer: "Colorado River" },
        { questionText: "What is the largest hot desert in the world?", options: ["Sahara", "Gobi", "Arabian", "Kalahari"], correctAnswer: "Sahara" }
      ]
    },
    {
      id: 2,
      title: "Animal Roles: Ecosystem Engineers",
      author: "WWF_Wild_Classroom",
      image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=500&q=80",
      category: "Nature",
      questions: [
        { questionText: "Tigers play a key role in the health of their habitat because they are...", options: ["Apex Predators", "Herbivores", "Scavengers", "Decomposers"], correctAnswer: "Apex Predators" },
        { questionText: "Which animal is known as the 'engineer' of the pond?", options: ["Beaver", "Otter", "Duck", "Frog"], correctAnswer: "Beaver" },
        { questionText: "Elephants help the ecosystem by...", options: ["Creating water holes", "Flying south", "Eating insects", "Sleeping"], correctAnswer: "Creating water holes" },
        { questionText: "Bees are essential for...", options: ["Pollination", "Making noise", "Eating leaves", "Scaring bears"], correctAnswer: "Pollination" },
        { questionText: "Earthworms improve soil by...", options: ["Aerating it", "Eating it", "Freezing it", "Heating it"], correctAnswer: "Aerating it" }
      ]
    },
    {
      id: 3,
      title: "Solar Eclipse Safety: Keep Your Peepers",
      author: "NASA_Official",
      image: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=500&q=80", 
      category: "Science",
      questions: [
        { questionText: "You can add a paper plate to eclipse glasses to improve...", options: ["Safety", "Style", "Color", "Taste"], correctAnswer: "Safety" },
        { questionText: "Never look directly at the sun without...", options: ["Eclipse Glasses", "Sunglasses", "Squinting", "A hat"], correctAnswer: "Eclipse Glasses" },
        { questionText: "A total solar eclipse happens when...", options: ["The Moon blocks the Sun", "The Sun blocks the Moon", "Earth blocks the Moon", "Mars blocks the Sun"], correctAnswer: "The Moon blocks the Sun" },
        { questionText: "The darkest part of the moon's shadow is called...", options: ["Umbra", "Penumbra", "Antumbra", "Shadow"], correctAnswer: "Umbra" },
        { questionText: "How long does a total eclipse last?", options: ["A few minutes", "A whole day", "One hour", "10 seconds"], correctAnswer: "A few minutes" }
      ]
    },
    {
      id: 4,
      title: "Why do we dream?",
      author: "TED-Ed_Official",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80",
      category: "Psychology",
      questions: [
        { questionText: "Why do you think we dream?", options: ["To process emotions", "To predict the future", "To rest eyes", "No reason"], correctAnswer: "To process emotions" },
        { questionText: "REM stands for...", options: ["Rapid Eye Movement", "Real Energy Motion", "Random Eye Motion", "Rapid Ear Movement"], correctAnswer: "Rapid Eye Movement" },
        { questionText: "Most dreams happen during...", options: ["REM Sleep", "Deep Sleep", "Napping", "Waking up"], correctAnswer: "REM Sleep" },
        { questionText: "Lucid dreaming means...", options: ["Knowing you are dreaming", "Having nightmares", "Sleepwalking", "Dreaming in color"], correctAnswer: "Knowing you are dreaming" },
        { questionText: "A 'nightmare' is usually caused by...", options: ["Stress or anxiety", "Too much sugar", "Loud noises", "Sleeping too much"], correctAnswer: "Stress or anxiety" }
      ]
    }
  ],
  kids: [
    {
      id: 5,
      title: "Disney Movies",
      author: "DisneyFan",
      image: "https://images.unsplash.com/photo-1613679074971-91fc27180061?w=500&q=80",
      category: "Fun",
      questions: [
        { questionText: "Who is the ice queen in Frozen?", options: ["Anna", "Elsa", "Moana", "Belle"], correctAnswer: "Elsa" },
        { questionText: "What kind of animal is Simba?", options: ["Tiger", "Bear", "Lion", "Cat"], correctAnswer: "Lion" },
        { questionText: "What is the name of the toy cowboy?", options: ["Buzz", "Woody", "Jessie", "Andy"], correctAnswer: "Woody" },
        { questionText: "What type of fish is Nemo?", options: ["Clownfish", "Goldfish", "Shark", "Tuna"], correctAnswer: "Clownfish" },
        { questionText: "Name the mouse with red shorts.", options: ["Minnie", "Donald", "Goofy", "Mickey"], correctAnswer: "Mickey" }
      ]
    },
    {
      id: 6,
      title: "Math Whiz",
      author: "MathClub",
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80",
      category: "Math",
      questions: [
        { questionText: "2 + 2 = ?", options: ["3", "4", "5", "6"], correctAnswer: "4" },
        { questionText: "What comes after 9?", options: ["8", "11", "10", "12"], correctAnswer: "10" },
        { questionText: "10 - 5 = ?", options: ["2", "5", "10", "15"], correctAnswer: "5" },
        { questionText: "Sides in a triangle?", options: ["3", "4", "5", "6"], correctAnswer: "3" },
        { questionText: "3 x 3 = ?", options: ["6", "9", "12", "33"], correctAnswer: "9" }
      ]
    },
    {
      id: 7,
      title: "Superheroes",
      author: "ComicStan",
      image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=500&q=80",
      category: "Fun",
      questions: [
        { questionText: "Who is Peter Parker?", options: ["Batman", "Superman", "Spider-Man", "Iron Man"], correctAnswer: "Spider-Man" },
        { questionText: "Captain America's shield is...", options: ["Iron", "Steel", "Vibranium", "Gold"], correctAnswer: "Vibranium" },
        { questionText: "Batman lives in...", options: ["Metropolis", "Gotham City", "New York", "Star City"], correctAnswer: "Gotham City" },
        { questionText: "Who turns green?", options: ["The Flash", "Thor", "Hulk", "Hawk Eye"], correctAnswer: "Hulk" },
        { questionText: "Iron Man is...", options: ["Tony Stark", "Steve Rogers", "Bruce Wayne", "Clark Kent"], correctAnswer: "Tony Stark" }
      ]
    },
    {
      id: 8,
      title: "Dinosaurs",
      author: "DinoPark",
      image: "../public/dino.jpg",
      category: "History",
      questions: [
        { questionText: "King of Dinosaurs?", options: ["T-Rex", "Triceratops", "Stegosaurus", "Raptor"], correctAnswer: "T-Rex" },
        { questionText: "Herbivores ate...", options: ["Meat", "Fish", "Plants", "Insects"], correctAnswer: "Plants" },
        { questionText: "Three horned dino?", options: ["T-Rex", "Triceratops", "Spinosaurus", "Brachiosaurus"], correctAnswer: "Triceratops" },
        { questionText: "Did dinos live with us?", options: ["Yes", "No", "Maybe", "Only pet ones"], correctAnswer: "No" },
        { questionText: "Long neck dino?", options: ["Brachiosaurus", "T-Rex", "Raptor", "Stegosaurus"], correctAnswer: "Brachiosaurus" }
      ]
    }
  ],
  students: [
    {
      id: 9,
      title: "React.js Basics",
      author: "DevCommunity",
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80",
      category: "Coding",
      questions: [
        { questionText: "Hook for side effects?", options: ["useState", "useEffect", "useRef", "useMemo"], correctAnswer: "useEffect" },
        { questionText: "What is JSX?", options: ["JavaScript XML", "Java Syntax", "JSON X", "Java Source"], correctAnswer: "JavaScript XML" },
        { questionText: "Component memory?", options: ["Props", "State", "DOM", "Redux"], correctAnswer: "State" },
        { questionText: "What is Virtual DOM?", options: ["A virus", "A database", "Lightweight copy of DOM", "Browser extension"], correctAnswer: "Lightweight copy of DOM" },
        { questionText: "Parent to Child data?", options: ["State", "Props", "Context", "Redux"], correctAnswer: "Props" }
      ]
    },
    {
      id: 10,
      title: "World History",
      author: "HistoryChannel",
      image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=500&q=80",
      category: "History",
      questions: [
        { questionText: "First US President?", options: ["Lincoln", "Washington", "Jefferson", "Adams"], correctAnswer: "Washington" },
        { questionText: "WWII ended in?", options: ["1940", "1945", "1950", "1939"], correctAnswer: "1945" },
        { questionText: "Who built Pyramids?", options: ["Romans", "Greeks", "Egyptians", "Mayans"], correctAnswer: "Egyptians" },
        { questionText: "Caesar ruled which empire?", options: ["Greek", "Roman", "British", "Ottoman"], correctAnswer: "Roman" },
        { questionText: "Apollo 11 year?", options: ["1965", "1969", "1972", "1959"], correctAnswer: "1969" }
      ]
    },
    {
      id: 11,
      title: "Literature 101",
      author: "BookClub",
      image: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=500&q=80",
      category: "English",
      questions: [
        { questionText: "Romeo and Juliet author?", options: ["Dickens", "Austen", "Shakespeare", "Twain"], correctAnswer: "Shakespeare" },
        { questionText: "Harry Potter school?", options: ["Hogwarts", "Durmstrang", "Beauxbatons", "Ilvermorny"], correctAnswer: "Hogwarts" },
        { questionText: "Pride and Prejudice author?", options: ["Bronte", "Austen", "Woolf", "Plath"], correctAnswer: "Austen" },
        { questionText: "Great Gatsby's name?", options: ["Tom", "Nick", "Jay", "George"], correctAnswer: "Jay" },
        { questionText: "1984 author?", options: ["Huxley", "Orwell", "Bradbury", "Tolkien"], correctAnswer: "Orwell" }
      ]
    },
    {
      id: 12,
      title: "Basic Physics",
      author: "PhysicsFun",
      image: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&q=80",
      category: "Science",
      questions: [
        { questionText: "Speed of light?", options: ["300,000 km/s", "150,000 km/s", "1,000 km/s", "Sound speed"], correctAnswer: "300,000 km/s" },
        { questionText: "Comes down but never up?", options: ["Rain", "Smoke", "Air", "Rocket"], correctAnswer: "Rain" },
        { questionText: "Newton's first law?", options: ["Gravity", "Inertia", "Action-Reaction", "Thermodynamics"], correctAnswer: "Inertia" },
        { questionText: "Unit of Force?", options: ["Joule", "Watt", "Newton", "Pascal"], correctAnswer: "Newton" },
        { questionText: "E = mc^2?", options: ["Tesla", "Newton", "Einstein", "Edison"], correctAnswer: "Einstein" }
      ]
    }
  ]
};