// Register module on Foundry init
Hooks.once('init', () => {
  console.log("Corpunk D6 | Initializing module");

  // Create global game.corpunk namespace if it doesn't exist
  game.corpunk = game.corpunk || {};

  /**
   * Roll a d6 pool
   * @param {Object} options
   * @param {number} options.dice - Number of d6 to roll
   */
  game.corpunk.rollD6Pool = async function ({ dice = 0 } = {}) {
    // If no dice specified, ask the user
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
    }

    await _rollDice(dice);
  };

  // Internal helper
  async function _rollDice(numDice) {
    // Create the Roll object
    const roll = await new Roll(`${numDice}d6`).evaluate({async: true});

    // Show Dice So Nice if installed
    if (game.modules.get("dice-so-nice")?.active) {
      await game.dice3d.showForRoll(roll);
    }

    // Count results for summary visuals
    const counts = [0, 0, 0, 0, 0, 0];
    for (const r of roll.dice[0].results) counts[r.result-1]++;
    const totalSixes = counts[5];
    const ordered = counts.slice().reverse();

    // Build summary HTML
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

    // Create chat message with proper roll object
    ChatMessage.create({
      user: game.user.id,
      content: `<div style="display:flex; gap:1px; align-items:center;">${diceHTML}</div>`,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll
    });
  }
});
