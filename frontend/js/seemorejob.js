document.getElementById('seeMoreBtn').addEventListener('click', function() {
    let hiddenItems = document.querySelectorAll('#portfolio-container .hidden');
    hiddenItems.forEach(item => item.classList.remove('hidden'));
    this.style.display = 'none'; // Hide button after revealing items
});