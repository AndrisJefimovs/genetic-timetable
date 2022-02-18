const fs = require("fs");

let rooms = [];
let classes = [];
let subjects = [];
let teachers = [];

try {
    // read preset file
    const rawFile = fs.readFileSync("./config.json", "utf8");
    // parse JSON string to JSON object
    const data = JSON.parse(rawFile);
    // add rooms to array
    rooms = [...data.rooms];
    // add teachers to array
    teachers = [...data.teachers];
    // add classes to array
    classes = [...data.classes];
    // add subjects to array
    subjects = [...data.subjects];
} catch (err) {
    console.log(`Error reading file from disk: ${err}`);
}

let lessons = [];

// generate a pool of lessons to fill the timetable with
for (const _class of classes) {
    for (const subject of subjects) {
        for (const requirement of subject.requirements) {
            // if subject is required in a grade then add it with amount of quota to the pool
            if (requirement.grade === _class.grade) {
                for (let i = 0; i < requirement.quota; i++) {
                    lessons.push({
                        class: _class.key,
                        grade: _class.grade,
                        subject: subject.name,
                        teacher: null,
                        room: null
                    });
                }
            }
        }
    }
}

// add id's to all lessons in random order
shuffleArray(lessons);
let i = 0;
for (const lesson of lessons) {
    lesson.id = i++;
}

module.exports = class DNA {
    constructor() {
        // array holding the whole timetable in form of 25 cells for 5 days with 5 lessons
        this.timetable = [];
        for (let i = 0; i < 25; i++) {
            this.timetable.push([]);
        }

        // copy lessons array for this exact iteration and shuffle it
        const lessonsPool = [...lessons];
        shuffleArray(lessonsPool);

        for (const lesson of lessonsPool) {
            const subject = subjects.filter(sub => sub.name == lesson.subject)[0];
            // list of all allowed rooms for subject
            const potentialRooms = subject.rooms ? subject.rooms : rooms;
            // assign a random room from the list to the lesson
            lesson.room = potentialRooms[Math.floor(Math.random() * potentialRooms.length)];

            // find a random teacher for the subject
            const potentialTeachers = teachers.filter(teacher => teacher.subjects.includes(lesson.subject));
            // assign a random teacher from the list to the lesson
            lesson.teacher = potentialTeachers[Math.floor(Math.random() * potentialTeachers.length)];
        }



        // indexes of available slots to choose from while filling in
        const availableSlots = [];
        for (let i = 0; i < 5 * 5; i++) {
            availableSlots.push(i);
        }

        // check if there is even enough space for all lessons to take place
        if (availableSlots.length * rooms.length < lessonsPool.length) {
            throw 'More lessons than available slots!';
        }

        shuffleArray(availableSlots);

        for (const lesson of lessonsPool) {
            // select a slot and remove it from available ones
            const slotIndex = Math.floor(Math.random() * availableSlots.length);
            const selectedSlot = availableSlots[slotIndex];
            // put a lesson in a random slot
            this.timetable[selectedSlot].push(lesson);
        }
    }

    getHTML() {
        let dom = `
        <html>
        <head>
        <style>
        table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
            text-align: center;
            font-size: 0.75rem;
          }
        </style>
        </head>
        <body>
        <table>
        <tr>
            <th>MO 1</th>
            <th>MO 2</th>
            <th>MO 3</th>
            <th>MO 4</th>
            <th>MO 5</th>
            <th>DI 1</th>
            <th>DI 2</th>
            <th>DI 3</th>
            <th>DI 4</th>
            <th>DI 5</th>
            <th>MI 1</th>
            <th>MI 2</th>
            <th>MI 3</th>
            <th>MI 4</th>
            <th>MI 5</th>
            <th>DO 1</th>
            <th>DO 2</th>
            <th>DO 3</th>
            <th>DO 4</th>
            <th>DO 5</th>
            <th>FR 1</th>
            <th>FR 2</th>
            <th>FR 3</th>
            <th>FR 4</th>
            <th>FR 5</th>
        </tr>
        `;

        let maxSlotLength = 0;
        this.timetable.forEach(slot => {
            if (slot.length > maxSlotLength) {
                maxSlotLength = slot.length;
            }
        });

        for (let i = 0; i < maxSlotLength; i++) {
            dom += `<tr>`;
            this.timetable.forEach(slot => {
                if (slot[i]) {
                    dom += `<td>${slot[i].class}<br /><b>${slot[i].subject}</b><br /><i>${slot[i].teacher.name}(${slot[i].teacher.id})</i><br /><i>${slot[i].room}</i></td>\n`;
                } else {
                    dom += `<td></td>`;
                }
            });
            dom += `</tr>`;
        }

        dom += `</table></body></html>`;
        return dom;
    }

    strictFitness() {
        // check for duplicate classes in slot
        let simultaneousLessonsCount = 0;
        for (const slot of this.timetable) {
            let simultaneousLessons = [];
            slot.forEach(parallelLesson => {
                if (simultaneousLessons.includes(parallelLesson.class)) {
                    simultaneousLessonsCount++;
                } else {
                    simultaneousLessons.push(parallelLesson.class);
                }
            });
        }

        // check for duplicate teachers in one slot
        let simultaneousTeachersCount = 0;
        for (const slot of this.timetable) {
            let simultaneousTeachers = [];
            slot.forEach(parallelLesson => {
                if (simultaneousTeachers.includes(parallelLesson.teacher.id)) {
                    simultaneousTeachersCount++;
                } else {
                    simultaneousTeachers.push(parallelLesson.teacher.id);
                }
            });
        }

        // check for duplicate rooms in one slot
        let duplicateRoomsCount = 0;
        for (const slot of this.timetable) {
            let duplicateRooms = [];
            slot.forEach(parallelLesson => {
                if (duplicateRooms.includes(parallelLesson.room)) {
                    duplicateRoomsCount++;
                } else {
                    duplicateRooms.push(parallelLesson.room);
                }
            });
        }

        // check if teachers are available on set times
        let unavailableTeachersCount = 0;
        for (const slot of this.timetable) {
            slot.forEach((parallelLesson, index) => {
                if (!parallelLesson.teacher.availability[index]) {
                    unavailableTeachersCount++;
                }
            });
        }

        // check if teachers are available on set times
        let multipleTeachersCount = 0;
        let subjectTeacherPairs = [];
        for (const slot of this.timetable) {
            slot.forEach(parallelLesson => {
                if (!subjectTeacherPairs[parallelLesson.class]) {
                    subjectTeacherPairs[parallelLesson.class] = [];
                }
                if (!subjectTeacherPairs[parallelLesson.class][parallelLesson.subject]) {
                    subjectTeacherPairs[parallelLesson.class][parallelLesson.subject] = [];
                }
                subjectTeacherPairs[parallelLesson.class][parallelLesson.subject].push(parallelLesson.teacher.id);
            });
        }
        for (const _class in subjectTeacherPairs) {
            for (const subject in subjectTeacherPairs[_class]) {
                const uniqueTeachersCount = [...new Set(subjectTeacherPairs[_class][subject])].length;
                if (uniqueTeachersCount > 1) {
                    multipleTeachersCount++;
                }
            }
        }

        console.log(simultaneousTeachersCount, ' teacher issues');

        return 1 / (1 + multipleTeachersCount + simultaneousLessonsCount + simultaneousTeachersCount + unavailableTeachersCount + duplicateRoomsCount);
    }
};

// https://www.w3docs.com/snippets/javascript/how-to-randomize-shuffle-a-javascript-array.html
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}