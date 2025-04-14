document.addEventListener("DOMContentLoaded", async () => {
  const userList = document.getElementById("user-list"); // Target the container

  try {
    const response = await fetch("http://localhost:5000/api/users");
    const users = await response.json();

    users.forEach((user) => {
      const userItem = document.createElement("div");
      userItem.classList.add("user-card");

      userItem.innerHTML = `
        <h3>${user.fullName}</h3>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Phone:</strong> ${user.phoneNumber}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p><strong>Skills:</strong> ${user.skills.join(", ")}</p>
      `;

      userList.appendChild(userItem);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
});
