const $ = document.querySelector.bind(document);
const tracks = await fetch("tracks.json").then(r => r.json());
const maxRounds = 5;

class Game {
  round = 0;
  title = pickTitle(tracks);
  guesses = new Array(maxRounds).fill("");
  el = {
    title: $("#title"),
    player: $("#player"),
    guesses: $("#guesses"),
    results: $("#results"),
  };

  constructor() {
    this.el.title.innerText += ` #${getDay()}`;
    this.el.player.src = tracks[this.title];
    this.el.player.ontimeupdate = () => {
      if (this.el.player.currentTime >= 2**this.round) {
        this.el.player.pause();
        this.el.player.currentTime = 0;
      }
    };

    this.renderGuesses();
  }

  renderGuesses() {
    this.el.guesses.innerHTML = "";
    for (let i = 0; i < maxRounds; i++) {
      const el = document.createElement("div")
      el.innerText = this.guesses[i] || "";
      // TODO: set css class according to skip/fail/open/pass
      this.el.guesses.append(el);
    }
    const el = this.el.guesses.children[this.round];
    el.append(...autocomplete(Object.keys(tracks), title => {
      this.guesses[this.round] = title;
      if (title == this.title || this.round+1 >= maxRounds) {
        this.renderResults();
      } else {
        this.round++;
        this.renderGuesses();
      }
    }));
  }

  renderResults() {
    const results = this.guesses.map((x, i) => {
      if (x === this.title) return `🟩`;
      else if (x === "" && i > this.round) return `⬜`;
      else if (x === "") return `🟨`;
      else return `🟥`;
    }).join("");
    this.el.results.classList.add("active");
    this.el.results.innerText = `Hoerdle #${getDay()}: ${results}
Title: ${this.title}`;
  }
}

new Game();

function getDay() {
  const firstDay = new Date("2022-05-07").getTime();
  return Math.floor((Date.now() - firstDay) / 1000 / 60 / 60 / 24);
  //
}

function pickTitle(tracks) {
  const options = Object.keys(tracks);
  return options[getDay() % options.length];
}

function autocomplete(values, f) {
  const input = document.createElement("input");
  const id = Date.now();
  input.setAttribute("list", id);
  input.onkeypress = function(e) {
    if (e.key == "Enter") {
      const x = input.value.toLowerCase();
      const suggestions = values.filter(v => v.toLowerCase().includes(x));
      if (suggestions.length) {
        input.value = suggestions[0];
        input.setCustomValidity("");
      } else {
        input.value = "";
        input.setCustomValidity("invalid");
      }
    }
  };
  const datalist = Object.assign(document.createElement("datalist"), {id});
  for (let value of values) {
    datalist.append(Object.assign(document.createElement("option"), {value}));
  }
  const button = document.createElement("button");
  button.innerText = "OK";
  button.onclick = () => f(input.value);
  // TODO: only enable button if input valid
  return [input, button, datalist];
}


function onSubmit(guess) {
  if (guess == title) {
    showResults(true)
  } else if (round == maxRounds-1)  {
    showResults(false)
  } else {
    el.guesses.children[round].innerText = guess;
  }
  console.log("submit", guess, title);
  round++;
  el.round.innerText = round+1;
}

function showResults(result) {
  console.log("showing results " + result)
}
