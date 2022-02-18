const DNA = require('./DNA');
const fs = require('fs');

const POPULATION_SIZE = 5;

let population = [];

// initial population
for (let i = 0; i < POPULATION_SIZE; i++) {
    population.push(new DNA());
}

let i = 1;
do {
    // selection
    // array of indices and fitness values
    const rangList = [];
    population.forEach((element, index) => {
        rangList.push([index, element.strictFitness()]);
    });
    // sort by fitness
    rangList.sort((a, b) => b[1] - a[1]);

    // print the best individual
    console.log('Best fitness in current population: ', population[rangList[0][0]].strictFitness());
    let markup = '';
    population.forEach(element => markup += element.getHTML());
    fs.writeFileSync('table.html', markup);
    // "wheel of fortune"
    const matingPool = [];
    rangList.forEach(item => {
        for (let i = 0; i < Math.floor(item[1] * 100); i++) {
            matingPool.push(population[item[0]]);
        }
    });
    // mix up the array
    shuffleArray(matingPool);

    // crossover
    const newPopulation = [];
    while (newPopulation.length < POPULATION_SIZE) {
        const child = new DNA();
        const partnerA = matingPool[Math.floor(Math.random() * matingPool.length)];
        const partnerB = matingPool[Math.floor(Math.random() * matingPool.length)];

        const firstHalf = [];
        for (let i = 0; i < 25; i++) { firstHalf.push([]); }
        const secondHalf = [];
        for (let i = 0; i < 25; i++) { secondHalf.push([]); }

        for (let i = 0; i < Math.floor(getLessonCount(child.timetable) / 2); i++) {
            const coordinates = getCoordinatesFromId(i, partnerA.timetable);
            firstHalf[coordinates[0]].push(partnerA.timetable[coordinates[0]][coordinates[1]]);
        }

        for (let i = Math.floor(getLessonCount(child.timetable) / 2); i < getLessonCount(child.timetable); i++) {
            const coordinates = getCoordinatesFromId(i, partnerB.timetable);
            secondHalf[coordinates[0]].push(partnerB.timetable[coordinates[0]][coordinates[1]]);
        }

        for (let i = 0; i < 25; i++) {
            child.timetable[i] = [];
            firstHalf[i].forEach(element => child.timetable[i].push(element));
            secondHalf[i].forEach(element => child.timetable[i].push(element));
        }

        newPopulation.push(child);
    }

    population = [...newPopulation];

    i--;
} while (i);

console.log();

function crossover(a, b) {
    let child = new DNA();



    return child;
}

// https://www.w3docs.com/snippets/javascript/how-to-randomize-shuffle-a-javascript-array.html
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function getCoordinatesFromId(id, timetable) {
    let sIndex = null;
    let lIndex = null;
    timetable.forEach((slot, slotIndex) => {
        slot.forEach((lesson, lessonIndex) => {
            if (id == lesson.id) {
                sIndex = slotIndex;
                lIndex = lessonIndex;
            }
        });
    });
    return [sIndex, lIndex];
}

function getLessonCount(timetable) {
    let result = 0;
    timetable.forEach(slot => {
        slot.forEach(lesson => {
            result++;
        });
    });
    return result;
}