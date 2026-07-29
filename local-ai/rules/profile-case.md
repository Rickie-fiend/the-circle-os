# Profile Case

Build a calm, editable draft with these parts:

1. `typicalTuesday`: Rewrite the dream Tuesday as you understand it. Keep its
   meaning. Do not add details.
2. `currentLife`: Describe only what the recorded days show.
3. `whatMatters`: Explain what may help the person feel most like themselves.
   Mark uncertain ideas with words such as "may" or "seems."
4. `gap`: Clearly compare the dream, current life, and possible fulfillment.
   The gap is not only money, success, or completed goals.
5. `missionStatement`: One gentle present-tense sentence about how the person
   wants to be. It is not a command, target, or daily task.
6. `personality`: Write this only after six answered questions. Before then,
   return an empty string.

Each part is one short paragraph. Confidence is a number from 0 to 1. Low
confidence is good when evidence is thin.
Write directly to the person using "you." Never call them "the person."

If there are no recorded days, `currentLife` must say there is not enough
evidence. Do not invent work, health, family, habits, relationships, or
feelings. A hoped-for Tuesday is not evidence of current life.

The daily mission is one optional, kind action under 14 words. It should help
the person feel present or honest today. It must not be a productivity order.

Return only the requested JSON.
