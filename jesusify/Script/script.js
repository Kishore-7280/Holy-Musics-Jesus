// Function to allow only one song to play at a time
const allAudios = document.querySelectorAll('audio');

allAudios.forEach((audio) => {
  audio.addEventListener('play', () => {
    allAudios.forEach((otherAudio) => {
      if (otherAudio !== audio) {
        otherAudio.pause();
      }
    });

    // Update Now Playing in footer
    const songTitle = audio.closest('.song-card').querySelector('h3').innerText;
    document.getElementById('current-song').textContent = songTitle;
  });
});

// Lyrics toggle
const lyricsButtons = document.querySelectorAll('.lyrics-btn');

lyricsButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const lyricsDiv = button.parentElement.nextElementSibling;
    lyricsDiv.classList.toggle('show');
  });
});
