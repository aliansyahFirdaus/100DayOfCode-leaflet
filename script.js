'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');

const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;

    // return this.description;
  }
}

class Run extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #maps;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._goToPopup.bind(this));
  }

  _getPosition() {
    navigator.geolocation?.getCurrentPosition(this._loadMap.bind(this), () => {
      alert('Error get location');
    });
  }

  _loadMap(pos) {
    const { latitude, longitude } = pos.coords;

    this.#maps = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#maps);

    this.#maps.on('click', this._showForm.bind(this));

    this.#workouts.forEach(w => {
      this._renderWorkoutsMarker(w);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'));
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    let workout;

    const { lat, lng } = this.#mapEvent.latlng;

    const validInput = (...input) => input.every(el => Number.isFinite(el));
    const positifInput = (...input) => input.every(el => Number.isFinite(el));

    e.preventDefault();

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInput(distance, duration, cadence) ||
        !positifInput(distance, duration, cadence)
      ) {
        return alert('Masukan angka bulat');
      }

      workout = new Run([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInput(distance, duration, elevation) ||
        !positifInput(distance, duration)
      ) {
        return alert('Masukan angka bulat');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    this._renderWorkoutsMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
    this._setLocalStorage();

    inputCadence.blur();
    inputElevation.blur();
  }

  _renderWorkoutsMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#maps)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? `🏃‍♂️` : `🚴‍♀️`} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    const html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? `🏃‍♂️` : `🚴‍♀️`
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${
            workout.type === 'running'
              ? workout.pace.toFixed(1)
              : workout.speed.toFixed(1)
          }</span>
          <span class="workout__unit">${
            workout.type === 'running' ? `min/km` : `km/h`
          }</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${
            workout.type === 'running'
              ? workout.cadence.toFixed(1)
              : workout.elevationGain
          }</span>
          <span class="workout__unit">${
            workout.type === 'running' ? `spm` : `m`
          }</span>
        </div>
      </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _goToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);

    console.log(workout, '==');

    this.#maps.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.workouts = JSON.stringify(this.#workouts);
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.workouts);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(w => {
      this._renderWorkout(w);
    });
  }
}

const app = new App();
app._getPosition();