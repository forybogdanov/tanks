function handleHitSound() {
    const element = document.createElement('audio');
    element.setAttribute('src', 'assets/hit_sound.mp3');
    element.play();
    element.volume = SOUNDS_VOLUME;
    document.body.appendChild(element);
}

function handleDieSound() {
    const element = document.createElement('audio');
    element.setAttribute('src', 'assets/die_sound.mp3');
    element.play();
    element.volume = SOUNDS_VOLUME;
    document.body.appendChild(element);
}