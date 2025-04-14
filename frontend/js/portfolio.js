document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");

  const titleEl = document.getElementById("portfolio-title");
  const listEl = document.getElementById("portfolio-users");

  if (!category) {
    titleEl.innerText = "Category not found!";
    return;
  }

  titleEl.innerText = `Freelancers in ${category}`;

  try {
    const res = await fetch(
      `/api/users/by-skill?category=${encodeURIComponent(category)}`
    );
    const users = await res.json();

    if (!users.length) {
      listEl.innerHTML = `<p class="text-gray-500">No freelancers found for this category.</p>`;
      return;
    }

    listEl.innerHTML = users
      .map(
        (user) => `
      <div class="p-4 border rounded-lg shadow-sm bg-white flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-center bg-cover bg-gray-200" style="background-image: url('${
          user.profileImage || "default-avatar.png"
        }')"></div>
        <div>
          <p class="font-semibold">${user.name}</p>
          <p class="text-sm text-gray-500">${user.rating} ⭐</p>
        </div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p class="text-red-500">Error fetching freelancers.</p>`;
  }
});
