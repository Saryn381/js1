let form = document.querySelector("#userForm");
let nameInput = document.querySelector("#name");
let ageInput = document.querySelector("#age");
let cityInput = document.querySelector("#city");
let users = document.querySelector("#users");

form.addEventListener("submit", function(event) {
    event.preventDefault();

    let name = nameInput.value;
    let age = ageInput.value;
    let city = cityInput.value;

    let user = document.createElement("div");
    user.classList.add("user");

    user.innerHTML = `
        <div class="user-header">
            <h2>${name}</h2>
            <button class="deleteBtn">🗑️</button>
        </div>
        <p>Age: ${age}</p>
        <p>City: ${city}</p>
    `;

    users.appendChild(user);

    let deleteButton = user.querySelector(".deleteBtn");

    deleteButton.addEventListener("click", function() {
        user.remove();
    });

    form.reset();
});