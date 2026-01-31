// main.js
Hooks.once('init', () => {
  console.log("Corpunk D6 | Initializing module");

  game.corpunk = game.corpunk || {};

   const cssPath = "modules/corpunk-roll-system/styles/corpunk.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = cssPath;
    document.head.appendChild(link);
    console.log("Corpunk Roll System | CSS loaded");
  }

  game.corpunk.rollD6Pool = async function ({ dice = 0 } = {}) {
    if (dice <= 0) {
      return new Dialog({
        title: "Roll d6 Pool",
        content: `
          <form>
            <div class="form-group">
              <label>Number of d6:</label>
              <input type="number" name="dice" value="1" min="1" required/>
            </div>
          </form>
        `,
        buttons: {
          roll: {
            label: "Roll",
            callback: async (html) => {
              const numDice = Number(html.find('input[name="dice"]').val());
              await _rollDice(numDice);
            }
          },
          cancel: { label: "Cancel" }
        },
        default: "roll"
      }).render(true);
    } else {
      await _rollDice(dice);
    }
  };

  async function _rollDice(numDice) {
    const roll = await new Roll(`${numDice}d6`).evaluate({ async: true });

    if (game.modules.get("dice-so-nice")?.active) {
      await game.dice3d.showForRoll(roll);
    }

    const counts = [0,0,0,0,0,0];
    for (const r of roll.dice[0].results) counts[r.result - 1]++;
    const totalSixes = counts[5];
    const ordered = counts.slice().reverse();
    const trayId = `dice-tray-${Date.now()}`;

    // Dice tray HTML
    const diceTrayHTML = roll.dice[0].results.map(r => {
      const value = r.result;
      let bg = "#444";
      let color = "#FFF";
      if (value === 6) bg = "#575";
      else if (value === 1) bg = "#755";
      return `
        <span style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:24px;
          height:24px;
          margin:1px;
          border-radius:4px;
          background:${bg};
          color:${color};
          font-weight:bold;
          font-family:'Orbitron', sans-serif;
          font-size:14px;
        ">${value}</span>
      `;
    }).join("");

    // Summary icons (always visible)
    const diceHTML = ordered.map((n, idx) => {
      const dieValue = 6 - idx;
      let src, size = 32;

      if (dieValue === 6 && n > 0) {
        if (totalSixes === 1) src = "custom_resources/svg/d6-cyber-success-1.svg";
        else if (totalSixes === 2) src = "custom_resources/svg/d6-cyber-success-2.svg";
        else if (totalSixes === 3) src = "custom_resources/svg/d6-cyber-success-3.svg";
        else if (totalSixes === 4 || totalSixes === 5) src = "custom_resources/svg/d6-cyber-success-5.svg";
        else if (totalSixes === 6 || totalSixes === 7) src = "custom_resources/svg/d6-cyber-success-7.svg";
        else if (totalSixes >= 8 && totalSixes <= 10) src = "custom_resources/svg/d6-cyber-success-10.svg";
        else src = "custom_resources/svg/d6-cyber-success-over.svg";
        size = 32 + Math.min(totalSixes * 2, 24);
      } else if (n === 0) src = "icons/svg/d6-grey.svg";
      else src = "custom_resources/svg/d6-cyber-yellow.svg";

      const numberColor = n === 0 ? "#666666" : "#000000";
      const glow = n === 0 ? "none" : "0 0 4px #FFFFFF";

      return `
        <span style="position: relative; display: inline-block; width:${size}px; height:${size}px;">
          <img src="${src}" width="${size}" height="${size}">
          <span style="
            position:absolute; inset:0;
            display:flex; align-items:center; justify-content:center;
            font-size:${size/2.5}px;
            font-weight:bold;
            font-family:'Orbitron', sans-serif;
            color:${numberColor};
            text-shadow:${glow};
            pointer-events:none;
          ">${n}</span>
        </span>
      `;
    }).join("");

    // Chat message content
  ChatMessage.create({
  user: game.user.id,
  content: `
    <div class="corpunk-dice-box">
      <!-- Toggle button image -->
      <img src="modules/corpunk-roll-system/assets/deployer.svg" class="corpunk-toggle-img" style="
        width: 20px;
        height: 20px;
        transition: transform 0.5s ease;
        display: block;
      ">

      <!-- Dice tray, initially hidden -->
      <div class="corpunk-dice-tray" style="
        display: none;
        flex-wrap: wrap;
        gap: 2px;
      ">${diceTrayHTML}</div>
    </div>

    <!-- Summary icons always visible -->
    <div style="display:flex; gap:1px; align-items:center;">${diceHTML}</div>
  `,
  type: CONST.CHAT_MESSAGE_TYPES.ROLL,
  roll
});

  }

  // Attach toggle logic
  Hooks.on("renderChatMessage", (message, html) => {
    const box = html.find(".corpunk-dice-box");
    const tray = html.find(".corpunk-dice-tray");
    const img = html.find(".corpunk-toggle-img");

    if (box.length && tray.length && img.length) {
      box.on("click", () => {
        const isOpen = tray.is(":visible");
        if (isOpen) {
          tray.slideUp(300);  // smooth hide
          img.css("transform", "rotate(0deg)");  // rotate back
        } else {
          tray.slideDown(300);  // smooth show
          img.css("transform", "rotate(-90deg)");  // rotate 90°
        }
      });
    }
  });
});
