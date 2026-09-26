const people = [
    {
        id: "ali",
        name: "Ali",
        username: "@ali",
        gender: "Male",
        age: 21,
        location: "Islamabad, Pakistan",
        occupation: "Student",
        bio: "Ali is a friendly and outgoing person who enjoys technology, gaming and spending time with friends.",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
        interests: ["Gaming", "Technology", "Football", "Music"]
    },
    {
        id: "ahmed",
        name: "Ahmed",
        username: "@ahmed",
        gender: "Male",
        age: 23,
        location: "Lahore, Pakistan",
        occupation: "Developer",
        bio: "Ahmed is interested in programming, computers and building useful digital projects.",
        image: "https://randomuser.me/api/portraits/men/44.jpg",
        interests: ["Programming", "Coding", "Gaming", "Cars"]
    },
    {
        id: "ayesha",
        name: "Ayesha",
        username: "@ayesha",
        gender: "Female",
        age: 20,
        location: "Karachi, Pakistan",
        occupation: "Student",
        bio: "Ayesha enjoys learning new things, photography and exploring creative hobbies.",
        image: "https://randomuser.me/api/portraits/women/44.jpg",
        interests: ["Photography", "Art", "Books", "Travel"]
    },
    {
        id: "mahnoor",
        name: "Mahnoor",
        username: "@mahnoor",
        gender: "Female",
        age: 22,
        location: "Islamabad, Pakistan",
        occupation: "Designer",
        bio: "Mahnoor is a creative designer who enjoys digital art, UI design and photography.",
        image: "https://randomuser.me/api/portraits/women/65.jpg",
        interests: ["Design", "Digital Art", "Photography", "Fashion"]
    },
    {
        id: "tahir",
        name: "Tahir",
        username: "@tahir",
        gender: "Male",
        age: 24,
        location: "Rawalpindi, Pakistan",
        occupation: "Business Owner",
        bio: "Tahir is interested in business, technology and learning about new ideas.",
        image: "https://randomuser.me/api/portraits/men/52.jpg",
        interests: ["Business", "Technology", "Cars", "Travel"]
    },
    {
        id: "maheen",
        name: "Maheen",
        username: "@maheen",
        gender: "Female",
        age: 21,
        location: "Multan, Pakistan",
        occupation: "Student",
        bio: "Maheen enjoys reading, music and discovering new places with her friends.",
        image: "https://randomuser.me/api/portraits/women/68.jpg",
        interests: ["Reading", "Music", "Travel", "Movies"]
    },
    {
        id: "anosha",
        name: "Anosha",
        username: "@anosha",
        gender: "Female",
        age: 20,
        location: "Faisalabad, Pakistan",
        occupation: "Student",
        bio: "Anosha is passionate about creativity, music and learning new skills.",
        image: "https://randomuser.me/api/portraits/women/33.jpg",
        interests: ["Music", "Art", "Writing", "Photography"]
    },
    {
        id: "hassan",
        name: "Hassan",
        username: "@hassan",
        gender: "Male",
        age: 22,
        location: "Peshawar, Pakistan",
        occupation: "Software Engineer",
        bio: "Hassan enjoys developing software, exploring new technologies and solving interesting problems.",
        image: "https://randomuser.me/api/portraits/men/75.jpg",
        interests: ["Programming", "Technology", "Chess", "Gaming"]
    },
    {
        id: "zainab",
        name: "Zainab",
        username: "@zainab",
        gender: "Female",
        age: 23,
        location: "Lahore, Pakistan",
        occupation: "Graphic Designer",
        bio: "Zainab loves creating digital artwork and experimenting with modern design ideas.",
        image: "https://randomuser.me/api/portraits/women/49.jpg",
        interests: ["Graphic Design", "Art", "Illustration", "Music"]
    },
    {
        id: "usman",
        name: "Usman",
        username: "@usman",
        gender: "Male",
        age: 25,
        location: "Karachi, Pakistan",
        occupation: "Photographer",
        bio: "Usman enjoys photography, traveling and capturing interesting moments from everyday life.",
        image: "https://randomuser.me/api/portraits/men/61.jpg",
        interests: ["Photography", "Travel", "Movies", "Cars"]
    },
    {
        id: "hiba",
        name: "Hiba",
        username: "@hiba",
        gender: "Female",
        age: 21,
        location: "Rawalpindi, Pakistan",
        occupation: "Content Creator",
        bio: "Hiba enjoys creating digital content, discovering new ideas and working on creative projects.",
        image: "https://randomuser.me/api/portraits/women/26.jpg",
        interests: ["Content Creation", "Writing", "Photography", "Fashion"]
    },
    {
        id: "hamza",
        name: "Hamza",
        username: "@hamza",
        gender: "Male",
        age: 23,
        location: "Quetta, Pakistan",
        occupation: "Student",
        bio: "Hamza is interested in computers, sports and learning about how modern technology works.",
        image: "https://randomuser.me/api/portraits/men/36.jpg",
        interests: ["Computers", "Football", "Gaming", "Technology"]
    }
];


const searchPage = document.getElementById("searchPage");
const profilePage = document.getElementById("profilePage");

const searchInput = document.getElementById("searchInput");
const peopleContainer = document.getElementById("peopleContainer");
const resultCount = document.getElementById("resultCount");
const noResults = document.getElementById("noResults");

const backButton = document.getElementById("backButton");

const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const profileUsername = document.getElementById("profileUsername");
const profileBio = document.getElementById("profileBio");
const profileAge = document.getElementById("profileAge");
const profileGender = document.getElementById("profileGender");
const profileLocation = document.getElementById("profileLocation");
const profileOccupation = document.getElementById("profileOccupation");
const profileInterests = document.getElementById("profileInterests");


function displayPeople(list) {
    peopleContainer.innerHTML = "";

    list.forEach(person => {
        const card = document.createElement("div");

        card.className = "person";

        card.innerHTML = `
            <img src="${person.image}" alt="${person.name}">
            <h2>${person.name}</h2>
            <p>Click to view profile</p>
        `;

        card.addEventListener("click", function () {
            showProfile(person.id);
        });

        peopleContainer.appendChild(card);
    });

    const count = list.length;

    resultCount.textContent =
        `${count} ${count === 1 ? "person" : "people"} found`;

    noResults.style.display =
        count === 0 ? "block" : "none";
}


function showProfile(id) {
    const person = people.find(item => item.id === id);

    if (!person) {
        return;
    }

    profileImage.src = person.image;
    profileImage.alt = person.name;

    profileName.textContent = person.name;
    profileUsername.textContent = person.username;

    profileBio.textContent = person.bio;

    profileAge.textContent = person.age;
    profileGender.textContent = person.gender;
    profileLocation.textContent = person.location;
    profileOccupation.textContent = person.occupation;

    profileInterests.innerHTML = "";

    person.interests.forEach(interest => {
        const tag = document.createElement("span");

        tag.className = "interest";
        tag.textContent = interest;

        profileInterests.appendChild(tag);
    });

    searchPage.style.display = "none";
    profilePage.style.display = "block";

    window.scrollTo(0, 0);
}


function showSearchPage() {
    profilePage.style.display = "none";
    searchPage.style.display = "block";

    window.scrollTo(0, 0);
}


searchInput.addEventListener("input", function () {
    const value = searchInput.value.trim().toLowerCase();

    const filteredPeople = people.filter(person => {
        return person.name.toLowerCase().includes(value);
    });

    displayPeople(filteredPeople);
});


backButton.addEventListener("click", function () {
    showSearchPage();
});


displayPeople(people);