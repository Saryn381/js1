function showToast() {
    let toast = document.getElementById("toast");

    toast.textContent = "Your message has been saved!";
    toast.classList.add("show");

    setTimeout(function() {
        toast.classList.remove("show");
    }, 3000);
}
