let notes = JSON.parse(localStorage.getItem("notes")) || [];

const container = document.getElementById("notesContainer");
const search = document.getElementById("search");

function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));
}

function displayNotes(list = notes) {
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = '<p class="empty">No notes found</p>';
        return;
    }

    list.forEach((note) => {
        const noteBox = document.createElement("div");
        noteBox.className = "note";

        noteBox.innerHTML = `
            <input 
                type="text" 
                value="${escapeHTML(note.title)}"
                id="title-${note.id}"
            >

            <textarea id="text-${note.id}">${escapeHTML(note.text)}</textarea>

            <div class="note-buttons">
                <button class="save" onclick="saveNote(${note.id})">
                    Save
                </button>

                <button class="delete" onclick="deleteNote(${note.id})">
                    Delete
                </button>
            </div>
        `;

        container.appendChild(noteBox);
    });
}

function addNote() {
    const newNote = {
        id: Date.now(),
        title: "New Note",
        text: ""
    };

    notes.unshift(newNote);
    saveNotes();
    displayNotes();

    setTimeout(() => {
        document.getElementById(`title-${newNote.id}`).focus();
    }, 50);
}

function saveNote(id) {
    const title = document.getElementById(`title-${id}`).value;
    const text = document.getElementById(`text-${id}`).value;

    const note = notes.find(note => note.id === id);

    if (note) {
        note.title = title;
        note.text = text;
    }

    saveNotes();
    displayNotes();

    alert("Note saved!");
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);

    saveNotes();
    displayNotes();
}

search.addEventListener("input", function () {
    const value = search.value.toLowerCase();

    const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(value) ||
        note.text.toLowerCase().includes(value)
    );

    displayNotes(filtered);
});

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

displayNotes();
