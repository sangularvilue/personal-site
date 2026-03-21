/**
 * One-time script to seed "A Christmas Guest" into the blog.
 *
 * Run with your env vars set:
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npx tsx scripts/seed-christmas-guest.ts
 *
 * Or if you have a .env.local:
 *   npx tsx -r dotenv/config scripts/seed-christmas-guest.ts
 */

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const POSTS_KEY = "blog:posts";
const postKey = (id: string) => `blog:post:${id}`;

const content = `The lamps along P Street cast long, ominous shadows onto the white ground. Over the last few days, snow had been falling steadily in large, downy flakes, and now a layer of it covered the road completely, although one could still see the faint outline of the cobblestones in the shape of the white surface. The streetcar had made its last trip down P for the night, and so the flakes falling onto the rails would soon cover them too and lie undisturbed until Monday morning. The occasional fierce gust of wind would kick up a cloud of cold white frost into the air and make a hauntingly discordant noise, but on the whole the view from the street was peaceful. Some of the rowhouses looked inert and dead, but from the windows of others shone cheerful yellow lights, and an odd passerby might, if he wasn't too eager to get out of the cold, look in to see happy families settling in for a late dinner, or reading comfortably in their chairs, or sitting by the fire listening to the radio.

One rowhouse in particular, about halfway along the block and on the left side if you faced away from the university, would have greeted the stranger with a different view. Made out of two different shades of brownish-gray brick, it stood quite skinny and disconnected from the houses on either side. It was in the Victorian style, with two large bay windows facing the street and flanking the dark green door. The right window looked into the dining room and, if one had cared to look in, one would have seen a coterie of well-uniformed house-staff cleaning up after dinner. The other window was attached to the living room. Inside a fire roared, with Mrs. Whinmore sitting in her chair next to it and Ambassador Whinmore standing by the fire lighting his pipe with a thin stick burning at one end.

So far, the rotund ambassador lighting a pipe and the lean woman reading next to him would not have struck any Georgetonian voyeur as unusual. The unusual thing was their young son, Walter Whinmore. The nine-year-old was sitting the wrong way round on the bench inside of the bay window and had his nose pressed against the glass and his hands cupped around his eyes to see the outside world clearly. He was very tall for his age, by now almost five feet, and his father's corpulence served to make Walter's slight frame look even slighter; one might even have called him gangly. The distortion of his face by the windowpane, combined with the backlighting from the fire, gave the impression from outside that some misshapen ghoul occupied the house. Walter was presently pretending that the swirling clouds of snow kicked up by the wind were ghosts, and he imagined them as well-dressed gentlemen and ladies, like the ones from London, walking up and down the street. Whenever he saw a particularly good one, he pointed it out to his parents, who played along with diminishing indulgence.

The ambassador was in his mid-forties and quite stocky; although he was only five foot eight, he gave the impression of being much larger, and many who had never observed him for more than five minutes attributed to him a rather intimidating demeanor. Many who knew him better remarked that what Whinmore lacked in intelligence, he made up for in common sense and good humor.

He had inherited the Whinmore family land from his father just three years prior. The elder Whinmore had always managed his own dealings, and at his death the family had all been shocked to discover that the disorganized stacks of papers in his study had been concealing tens of thousands of pounds of gambling debts. The new Whinmore's hopes of retiring comfortably and happily on his family's estate were severely diminished. Whinmore happened to have a friend who soon became a part of King George V's new government, and he had offered Whinmore the title of ambassador to the United States, which Whinmore had accepted. The official residence had been far too stuffy, however, and so he had moved his whole family into a Georgetown rowhouse.

Mrs. Whinmore was in her mid-thirties, beautiful, and by far the smarter of the two. She was about as tall as the ambassador but no more than half his weight. Her education growing up had been immaculate, and she had received no fewer than eight separate proposals before meeting Whinmore, but each of the men had tried to impress her with their wealth, or their intelligence, or their feats of bravery. All of them had bored her. Whinmore, on the other hand, had tripped over his own feet walking in Mayfair and bumped into her, spilling her packages over the pavement. He had been so apologetic that she could tell that he genuinely meant the things he said to her, and the two had courted and married. Now Mrs. Whinmore was settling in extremely well as a Georgetown elite, and especially loved hosting diplomatic parties where she could watch Americans, who it seemed to her still idolized British culture, make fools out of themselves trying to adopt Britishisms and portray airs of sophistication while failing to correctly remember even the simplest etiquette. She never corrected them; at the end of the day they were a good sort, these Americans, even if a bit boorish.

---

Suddenly Walter startled. One of his ghosts was now looking all too real. What had one second before been a flurry of snow serving as a canvas for the boy's imagination was now a semi-translucent man standing by the streetlight. Walter spotted dozens of them now, all walking down the street greeting each other merrily.

"Mama, mama!" he cried. "I saw another one—a bunch! Look! Come quick!"

"It's not a ghost, Walter," Mrs. Whinmore responded lazily from her chair, not even lowering the book she was reading. "I've come the last three times you've called and there hasn't been anything there."

"No but this time I swear it's there! They're white and you can sort of see through them and they're walking up and down the street." One of them in particular, a tall bearded man in a top hat, seemed familiar.

"I think that that's the wind kicking up the snow, love," his mother replied, still staring at her book.

"Who would have reason to haunt Washington?" asked the ambassador from his chair. "The city's only been here a hundred years."

"Abraham Lincoln!" Walter exclaimed excitedly, realizing who the bearded man was. He had just learned about the American Civil War in school and had quickly come to admire the dead president, and now he was seeing him right outside his house. "Do you think that he wants to talk to Daddy?"

"He most certainly won't be," chimed in the ambassador as he continued the struggle to light his pipe. "If he wants to call my office in the morning, he can. But he isn't even the president anymore. You know that; I took you to the inauguration in Mar—blast it!" he interjected in the middle of his sentence, dropping the fully burned-through stick and shaking his singed right hand. Walter turned, startled by the noise. When he put his face back against the window, the spirits outside were gone. Ambassador Whinmore's pipe remained unlit, and he snatched another long stick from the box of them that rested on the mantle and lit it in the fire.

"Besides," the ambassador began again, "there's no such thing as ghosts. If Mr. Lincoln wants to talk to me, it'll have to wait till I'm dead and gone." Walter frantically scanned the street, looking for any sign of Lincoln, or of any of the ghosts. All he saw was snow blown by the wind.

"How do you know that there's no such thing, Daddy?" asked Walter. "What about Hamlet? Didn't he talk to a ghost?" Walter had been reading Hamlet in school too.

"Well, that's different," said the ambassador, sitting down with a finally-lit pipe. "Hamlet took place hundreds of years ago, when people didn't know yet that ghosts aren't real."

"Maybe they were real, but they all died out…" mused Walter aloud. "Well what about *A Christmas Carol*?"

"That doesn't prove that there are ghosts," the ambassador responded, but less sure than before. "Scrooge might have just dreamed them all."

"More to the point, darling," Mrs. Whinmore chimed in, finally putting down the book, "Hamlet and *A Christmas Carol* are both works of fiction. They are true in some senses, but you shouldn't think that everything that they say happened actually happened the way that they said it did."

"Very good dear, thank you," recovered the ambassador, glad to not have been defeated by his son. "Even the stories purporting to be true that attest to ghosts can't be trusted."

"Why not?" asked Walter.

"Well," said the ambassador, "the people that they chronicle aren't trustworthy sources. They are the sort of people who… who… Well, they're the sort of people who believe in ghosts!" he finally insisted.

"But Daddy, I just saw one!" began Walter, but his father had at least seen that he might have been outfoxed and cut him off, crying out "Nurse Rebecca! NURSE! Where is that woman?"

Walter's nurse, a kind, plump woman of about thirty with red hair, rushed down the steps that ran down the left side of the rear of the house. "Here, sir! I've just been drawing the young master's bath!" She came into the living room with her sleeves rolled up and her arms wet.

"Very good," responded the ambassador, getting that feeling that he so often did when he was flustered, as if everyone else had been reading lines from a script that he hadn't received. "He's been telling tall tales and I think it's time for him to go to bed."

"I'm telling the truth!" protested Walter as he walked to Nurse Rebecca past his mom, who kissed him goodnight. Taking his nurse's hand, he walked up the steps already yawning, but declared rather decisively that he was going to catch Lincoln's ghost and prove to the whole house that he hadn't been telling tall tales.

---

Fortunately for Walter, school had ended for Christmas break, and he had plenty of time to find Mr. Lincoln's ghost and talk to him. However, for all of his virtues, he was not a very patient boy, and so the next morning, which was the first Tuesday of his break and three days before Christmas, he decided that he was going to capture the ghost of Lincoln that very day and give it to his parents as a Christmas gift. Nurse Rebecca had helped him pick out a broach for his mother and a bow tie for his father, but wouldn't an honest-to-goodness ghost be better? None of the other boys would have been able to give their parents a ghost.

That morning, Walter put on his overcoat and boots and stepped out onto the street with a butterfly net his aunt had given him for his birthday. Mother said that he had to ask permission first if he was going to cross the street, so his hunt was confined to only the 3500 block of P street. He saw a ghost a few times, and each time he ran towards them waving his net, but always they had disappeared before he reached them. Besides, none of them had been as tall as Mr. Lincoln; he figured that Lincoln with his top hat would have stood about seven feet, but none of the translucent clouds had been much taller than Walter himself. It would be exciting to catch any ghost, but he had his heart set on Lincoln. He thought perhaps the president would like to see one of the new pennies that bore his image, and it would be such a wonderful show of friendship between the two countries if he could bring Lincoln home with him. Maybe he could even go with the president to meet the king.

After about an hour of him stomping around in the snow waving his net, Nurse Rebecca rushed out of the house frantically. "There you are!" she shrieked. "Why didn't you tell me you were going outside! You'll catch your death from the cold. Get inside this minute young master or your father will hear about this!" He followed her back inside, and after Nurse Rebecca had satisfied herself that her charge wasn't frostbitten, she put the kettle on and promised to take him to the Smithsonian if he behaved himself and agreed to stay right next to her the whole time. He nodded through her demands, the prospect of a trip to the museum causing him to momentarily forget about ghosts.

"Nurse," he asked her later that afternoon after they had come back from the museum, "have you ever seen something that you couldn't explain?"

"Well," she began, but then stopped. She was about to start telling him about the house in her hometown that everyone knew had a banshee brought over from Ireland, but then thought better of so clearly speaking against the opinions of the ambassador and his wife. "Well," she started again, "just because I can't explain something doesn't mean that it's unexplainable, young master."

"So you do believe in ghosts!" yipped Walter happily.

"I didn't say that. I did not say that," she responded hurriedly. "Look, besides, even if they were real, you can't catch one. How would you? Any cage you put him in, he'll just slide right out of."

Walter hadn't considered this, and, disappointed, he crumpled up and tossed into the wastebasket the plans he had been drawing for a cast-iron cage made out of the fence surrounding their small backyard. "But they touch people, right? One of my friends at school says she was grabbed by a ghost last summer. If they can grab us, why can't I grab them?"

"I suppose that if God permitted a soul to manifest to you, then maybe He'd permit you to catch it," she admitted. "But I very much doubt that you should, young master. Why trouble yourself with something that can't possibly be good for your soul?"

---

As it happened, Mrs. Whinmore had invited the bishop and his family to join them for dinner that evening. Bishop Martins had a daughter about Walter's age, and the two families had put the children next to each other in the hopes that they would entertain themselves. It didn't work; while Walter had tried to engage her on subjects as varied and diverse as ghosts, specters, apparitions, and Lincoln, it seemed that Priscilla Martin's only interest was nodding politely without contributing. After a while, she gave up nodding. As she pouted in boredom, Walter peppered the bishop with questions.

"Are ghosts real?" Walter asked.

"Well, we might want to clarify what we mean by ghosts, but perhaps in some sense, yes, and in some sense, no," hedged the bishop. "Obviously there is the Holy Ghost, but that isn't quite what you mean, I assume. The Gospel of Luke Chapter 16 certainly seems to take as a given that it is possible for a dead soul to appear to the living. And Solomon's interaction with the Witch of Endor also makes it seem like we can summon them. But if you mean to ask if you should be afraid of your closet being haunted, I can assure you that there is no such thing."

While Walter was not the most pious boy in his class, he did especially like feast days, and so this struck him as odd. "Didn't we just pray for the faithful departed to enter God's kingdom last month? What happens to all the souls that don't? What if they died unexpectedly and never got to see how the play ended?"

"I'm not quite sure what you mean by that last part," admitted the bishop, "but if you are really that worried about ghosts, I can have a priest come do a house blessing."

"I'm sure that that won't be necessary, Bishop," interrupted the ambassador. "Walter here has just been on a bit of a ghost streak recently, but it's about reached its end, hasn't it Walter?" Walter didn't know quite what a rhetorical question was, but whenever anyone said one, especially his father, he was still able to tell that he was supposed to agree with them and not say anything. Regardless, he was not convinced by the bishop.

Mrs. Whinmore skillfully redirected the conversation back towards what the bishop had been saying about how sophisticated and in line with Canterbury their diocese was, and how they made sure that all of their priests were sure to fit in "amongst the British."

"Oh yes, of course!" said the bishop, holding his fork wrong. "I'm sure that they'd be completely undetectable as Americans."

After the bishop and his insufferable daughter left, Walter was quickly handed off to Nurse Rebecca, who led him upstairs to help him get ready for bed. Soon, he was tucked in. "Have you said all of your prayers, young master?" she asked him.

"No," he responded bleary-eyed. Getting down from his bed, he knelt beside it. "And now I lay me down to sleep, and pray the Lord my soul to keep. If I should die before I wake, I pray the Lord my soul to take. And if you could let me see Mr. Lincoln, I promise you that I'll be so kind to him! And I'll pay better attention in church. Pleeeease!"

Nurse Rebecca had to stop herself from instantly correcting him and making him start over. After all, why wasn't that a perfectly fine thing to pray for? It wouldn't get him anywhere, but it couldn't hurt to try. He climbed back into bed and she pulled the blankets up over his shoulders.

"Goodnight, young master," she whispered in his ear.

"Goodnight, Nurse," he responded half-asleep.

---

Downstairs, Ambassador Whinmore stood near the mantel, a foot planted on the fender, fiddling with the bottom button of his waistcoat. His eyes were fixed firmly on the coals, searching them. Mrs. Whinmore sat upon the settee, smoothing a crease in her skirt. From the dining room drifted the quiet clink of porcelain and the gentle hum of Nurse Rebecca's voice, half-singing some tune as she tidied.

At length, the ambassador cleared his throat. "I suppose this business with Walter is not quite over," he said, low-voiced. "He's becoming so fixed on these…notions."

Mrs. Whinmore looked up, her expression even. "He's… he's just looking for something to pursue." "He is a boy brimming with curiosity," she replied.

The ambassador tugged gently on his watch chain. "Mmm," he managed. "It's just… I cannot like it. The idea that such… things… might press into our daily lives. I'm certain the bishop didn't mean to encourage that sort of thinking. The Church is one thing, but phantoms peering in our windows are another matter altogether. How's he supposed to learn how the world works if he thinks that there's a ghost behind everything?"

Before Mrs. Whinmore could reply, Nurse Rebecca entered, carrying a small tray on which sat two teacups and a sugar bowl. She paused at the threshold. "Pardon me, sir, ma'am," she said. "Just finishing up. Would either of you care for a cup? I've freshened the pot. Seems a shame to let it go to waste."

Mrs. Whinmore nodded gracefully, then hesitated. After a moment, she patted the cushion beside her. "Come, Rebecca. Sit a moment. I'd value your thoughts."

The ambassador did not object, though he shifted his weight and looked somewhat ill at ease. He turned to face the two.

Nurse Rebecca set the tray down and perched on the edge of a nearby chair, her posture respectful yet not stiff. "You're kind, ma'am," she said, smoothing her apron.

Mrs. Whinmore inclined her head. "Rebecca, do you suppose he's truly fixated on the supernatural? Or is there something else he's looking for?"

Rebecca tipped her head thoughtfully. "Well now," she began, her tone warm and measured, "I've known children to latch onto all sorts of notions—faeries, heroes, even a banshee or two in my own village."

The ambassador's face grew taut, though he strove for composure. "We've provided him ample guidance, have we not?" he said quietly. "Why must he step beyond what is…reasonable?" He glanced at the fireplace as if expecting an answer from it. "I cannot abide a son who believes in spirits. I prefer that certain ideas remain safely… contained… to services on Sundays."

Mrs. Whinmore stirred her tea, choosing her words with care. "Perhaps Walter simply needs to imagine a kind of champion—someone who stands tall in history and whispers that he, too, can be courageous. It may be less about ghosts, Edward, and more about a search for something noble and meaningful, a pattern or story he can fit himself into." She looked at her husband kindly. "He is a child threading together the pieces of what it means to be good, special, and seen."

Nurse Rebecca offered a small smile. "There's no harm in a lad dreaming a bit, sir," she ventured, voice gentle. "He'll learn soon enough what's flesh and what's fancy. But if he finds a measure of hope in that fancy for a time—well, I daresay we all remember a moment or two from our youth when we believed in something grand and out of reach."

The ambassador stood there. His discomfort was plain, but he said nothing for several seconds. At last, he spoke, his voice more measured but no less firm. "I only hope that he will keep his feet on the ground," he said. "We've enough to contend with in this world without leaning on illusions." He lifted his gaze to meet his wife's, his expression one of quiet entreaty.

Mrs. Whinmore reached over and gently touched his hand. "Of course," she said. "No one wants to see him lose himself entirely. In time, he'll find a balance. For now, let us be patient with his… experiments in meaning."

Nurse Rebecca stood, smoothing her apron. "I'll not say more, sir," she murmured, her gentle brogue settling the air. "But I'll be watchful, and kind. He's a fine boy."

The ambassador gave a curt nod, while Mrs. Whinmore smiled softly. Soon the nurse returned to her tasks, and the couple lingered a while longer. Outside, the snow fell still, and inside, the fire's glow drew long shadows on the floorboards.

---

The next morning was Tuesday, and Walter was certain that he would finally talk to Mr. Lincoln. Afterall, hadn't he prayed for it? He rehearsed to himself what he would say: "Mr. Lincoln, it is such an honor to meet you! I'm sorry that you were shot by that man. He was hanged."

He knew that he needed a better plan than before if he was going to be successful. Besides, a cursory examination revealed that Nurse Rebecca had preemptively locked the front door, so he was going to have to catch Lincoln from inside the house. He went back upstairs and opened up his sock drawer. Reaching towards the back, he pulled out a small deerskin bag that he had made in summer camp. Loosening the drawstring, he dumped out the entire contents on his bedspread. Six dollars and fifty-three cents, mostly in dimes and nickels, lay on his white sheets, plus a few dozen farthings, florins, shillings, sovereigns, and other British coins, which he set aside.

He meticulously counted the U.S. currency again, making sure no one had raided his life savings, and, happy to see that he still had six dollars and fifty-three cents, he started to separate out the coins by value. There were forty-three pennies, but most of them were the older kind with the Indian. He did, however, have eighteen with Lincoln's portrait on them. Putting the other coins back in the bag and rehiding it beneath his least favorite socks, he carried the eighteen with him to the first floor.

Walter sat in the bay window again, looking out at the street. He saw a few small ghosts form, but none of them looked tall enough to be Mr. Lincoln. After a few hours, a streetcar rolled past, and chasing after it he saw two ghosts. The one on the left must have been almost seven feet tall! Gleeful that not only would he get to meet Mr. Lincoln but also get to see his top hat, Walter hopped down off of the window seat and ran to the front door. He didn't see the ghost anymore, but he knew that he was nearby. He set a penny down, portrait up, on the floor.

Painfully parting with each one, he began laying a trail of pennies in the same manner, one every few feet, stretching towards the open closet at the back of the first floor. Now all he needed was Mr. Lincoln to float into the house and see the pennies. Walter resumed his spot at the window.

After about a half-hour, he heard the ghoulish moaning and low whistling that sometimes emanated from every wall of his house. It was always accompanied by all of the trees outside shaking, so Walter knew that there must be something supernatural happening. A sharp thud started breaking through the house's whines at random intervals.

"There's someone at the door!" Walter shouted gleefully at what could only be a ghost knocking. The ambassador's valet had gone with him on business, the chef did not arrive until four, and Mrs. Whinmore was out meeting with the parish decorating committee to get everything ready for tomorrow night, so the only person in the house besides Walter was Nurse Rebecca. She came running down the steps to greet the visitor, and, embarrassed to have left someone standing outside in the cold for so long, she frantically unbolted and flung open the door without looking through the peephole. No one stood outside. As the fierce winds blustered outside, Nurse Rebecca felt a cold gust of air fully envelop her, knock around some loose papers in the living room, and swirl toward the back of the house.

"Yippeee!" exclaimed Walter, running towards the back of the house and slamming shut the closet door. "I caught him! I caught Mr. Lincoln!" But before he could crack the door open a little bit to talk to the former president, Nurse Rebecca was holding him by the ear.

"Do you think that that's funny, young master? Do you? You've flustered me, let in a draft, disturbed my closet, and made a mess out of your pocket change. You just wait till your father gets home!" She led him by his ear upstairs and shut him in his room. Thirty minutes later, each passing second of which had been excruciating, she came in and told him that he had been very naughty but had served his time and would be allowed back downstairs if he promised to behave himself. Eager to go speak to his captive, he nodded through all of her demands and ran down the steps. When he flung open the door to the closet, however, he saw that his captivity by Nurse Rebecca had been long enough for Lincoln to escape. After all, he thought, *you have to be pretty smart to be president. Maybe they train you to get out of traps.* At supper he hardly touched his chicken and afterwards he slank upstairs, his usual boyish energy completely drained.

---

Once Walter had gone to bed, Ambassador and Mrs. Whinmore retired to the living room. After lighting his pipe, the ambassador sat down in his usual chair.

"You know, dear," he began, clearing his throat, "I can't help but think someone at St. Cuthbert's is filling the boy's head with all sorts of silliness."

Mrs. Whinmore looked up, her delicate brow arching slightly. "Silliness?"

"Yes, silliness!" he huffed, tugging at his waistcoat. "Ghosts and—and Lincoln, no less! I know what you said before, but it's just not natural for a boy to go on like that. I'll bet it's one of those teachers… the sort who think they can inspire young minds by… I don't know, regaling them with tall tales." He waved a hand in the air, hoping that the gesture would communicate the general sense he was failing to express.

Mrs. Whinmore smiled faintly, the firelight catching the soft curve of her cheek. "Or perhaps, darling, it's simply the natural imaginings of a curious boy. Not every wild notion is the fault of a rogue pedagogue."

"Curious? Certainly. But this…" He looked upwards at the ceiling of the living room, above which was Walter's bedroom. "This is… well, it's something else. Honestly, what do we do if he goes telling his classmates about his escapades? Can you imagine the teasing? It's all well and good to let the boy dream, but there's a line somewhere, isn't there?"

"You worry too much, Edward. Walter is nine. This is normal, but it will pass. I'm more worried about how disappointed he's inevitably going to be when he doesn't catch his ghost."

"A little disappointment now and then isn't the end of the world," the ambassador remarked. "It builds character, as they say."

---

Christmas Eve was here, and it was Walter's last chance. Clearly, some supernatural force was keeping him from successfully capturing a ghost with purely natural means. He needed supernatural help. As soon as he woke up, he knelt by the side of his bed and recited every prayer that he knew. He even went downstairs to the living room, found the Book of Common Prayer in the bookcase, and though his British copy, having been ratified in 1662, naturally did not have a specific prayer for trying to see the soul of a deceased American president, he spent at least half an hour reading aloud its prayer for remembrance of the dead alternated with its prayer for the king. After satisfying himself that he had done all he could to get in God's good graces, he put the book back and found Nurse Rebecca.

She was ironing his clothing, humming a tune to herself and occasionally singing a few lines before reverting back to a hum.

> *"Is there any room at your head, Willy?*
> *Or any room at your feet?*
> *Or any room at your side, Willy,*
> *Wherein that I may creep?"*

She seemed to be in a cheery mood, Walter thought.

"Nurse," he asked in his most well-behaved voice. "What are you doing this Christmas Eve?" She stopped singing.

"Well, young master, during the day I'll be minding you, same as always. The ambassador and your mother have given me tonight and tomorrow off, it being a holiday and all, and so I have to do some extra chores now to keep you tided over until Friday."

"I'm going to miss you, Nurse," Walter said truthfully. "Do you think we could do something fun together today?"

"I expect so, young master. And I'll miss you too. What did you have in mind?"

"I heard that Father Christmas is going to be at the Woodward and Lothrop downtown, and we can visit! Please can we go see him, Nurse, please!"

"Oh, alright. If that's what you want, we can go to Woodies." She checked the clock by the wall. "The streetcar comes through at 12:15. After that it won't be for another hour, and it ends at three today. We can't stay too long, but if you're ready to go in the next ten minutes it may still be worth it."

Walter raced upstairs and excitedly put on his thickest pants, a heavy wool sweater, his overcoat, a hat, and mittens. When he came downstairs, Nurse Rebecca had changed too, and was now wearing a thick dress that went down all the way to her shoes, with a heavy coat over it. She added earmuffs to her ensemble, and, hearing the distant whistle, the two rushed out the door and into the street.

They hailed the streetcar and stepped inside. To their surprise, there was only one other passenger, a man sitting near the back wearing a heavy brown overcoat with a fur collar. They found seats in the middle. The jostling of the streetcar bounced Walter in his seat and he rested his head against Nurse Rebecca's shoulder to reduce the shaking. After a few minutes, they reached Dupont Circle, where they turned off of P and began following Connecticut Ave. The man behind them pulled the cord and stood up. Once the car stopped and the doors opened, he got out and started walking into one of the large office buildings. The doors closed and the car began again.

For no particular reason, Walter looked back at the man's seat. He saw a glint of light reflecting off of a small object. Curious, he got down from his seat and walked towards the glint. When he reached the seat, he saw what had cast the light. A large gold coin lay where the man had been sitting. Walter picked it up and examined it. A woman carrying a torch was on one side of the coin, and a side-view of an eagle in flight was on the other. Above the eagle in capital letters were the words "UNITED STATES OF AMERICA" and, below that, "TWENTY DOLLARS." Twenty dollars would make it a double eagle. One of the boys in Walter's class last year had brought in a quarter eagle to show off, but Walter doubted that even he had ever seen a double eagle. Walter stared at it in wonder.

He made himself snap out of it. Reaching up, he pulled as hard as he could on the cord and slammed against the back before falling down as the car decelerated quickly. Nurse Rebecca looked back at him in surprise. Spotting him on the floor, she hurried towards him from her seat, but the doors swung open and he scrambled out on all fours before she could stop him. Walter looked to his right, where a crowd of people blocked his path. He ran as fast as he could towards the crowd, with Nurse Rebecca chasing after him as the streetcar drove off.

Walter, smaller than his nurse, was able to weave through the crowd faster than her and soon she was unable to see him. He made it out the other side and kept running. After a block, he was at the office building the man had gone into and Nurse Rebecca had made it out of the crowd and was running towards him. The door took all of his strength to open, but he finally made enough of a gap for him to slip through. The man with the fur-lined overcoat was inside the lobby walking towards another door at the back. Walter approached him.

"Excuse me… sir?" he began nervously. "I think you dropped this on the streetcar." Walter held out the gold coin as Nurse Rebecca entered the lobby, throwing open the door violently as she tried to find her charge. She spotted him next to the man.

"Master Walter, what are you doing, running off like that?" she shrieked.

"I needed to get to him before he got too far away, Nurse," Walter replied as Nurse Rebecca hugged him against her.

"Why? Who is he? And what are you doing?" Nurse Rebecca asked in quick succession in between the kisses of relief she was planting on his head.

"I believe that… did you say his name was Walter?" the man asked. When Nurse Rebecca nodded, he continued. "I believe that Walter here was just about to do a very good deed." The man pointed to the gold coin in Walter's hands. "Do you know how much that is worth, young man?"

Walter nodded. "Twenty dollars. It says so on the back. That makes it a double eagle."

"Well then," the man responded, "I'm impressed by both your honesty and your knowledge of coins."

"Thank you, sir," Walter replied. "I memorized them all when we came here last year."

"Ahhhh, so that explains the accent, then," the man reasoned. "Well, thank you very much," he said as he took the coin. The man put it in the right front pocket of his coat, where it made a clink as it collided with other coins. He rummaged through the pocket, feeling each coin, until he found the right one. He pulled out a smaller gold coin and offered it to Walter. On the front was the profile of an Indian man in full headdress facing left. On the back was an eagle on a branch. "E PLURIBUS UNUM" and "UNITED STATES" were on the same side as the eagle, and "2½ DOLLARS" stood below the branch.

"A quarter eagle! Really?" exclaimed Walter.

"It's yours," offered the man. "One good turn deserves another. You have my thanks, as well as my reward." Walter took the coin and stared at it in awe.

"I'm afraid that I'm very late for a meeting, but I hope the two of you have a very lovely day," he said to the two of them. Turning his attention to Rebecca, he left her with "You should be quite proud of him." The man smiled at both of them and walked through the door at the back of the lobby.

"We've lost the trolly, Nurse," Walter said. "But I did get a quarter eagle out of it!" Nurse's eyes were watered as she looked at Walter. "Don't you mind the trolly, Walter," she said. "We'll get you there without it."

She led him outside. The wind whipped at them, but they walked back towards where they had left the streetcar and continued on along Connecticut towards Farragut Square, which was only three blocks ahead. Inside the park, a half-dozen boys were building a snowman. They turned left and walked along K. The blocks began to blend together, but soon they reached 11th. Turning right, they walked only three more blocks until they reached the Woodies. Walter could barely feel his toes, and even Nurse Rebecca was shivering and had chattering teeth.

They rushed inside, into the warmth. Inside, the store bustled with activity. A sign at the front informed them that Santa was on the third floor inside the kids' section. Walter and Nurse Rebecca climbed the steps slowly, but by the time they reached the top of the second flight they had warmed up and taken off their heavy jackets. Walter heard the jingle of bells to his left and bolted towards it.

"You have to wait your turn!" shouted Nurse Rebecca as she bustled after him. Walter, who by now was almost able to touch the supernatural aid he desperately needed, turned and saw that there was a line of about ten or so boys and girls waiting to talk to the man.

Listening to the other children talk to him, Walter realized he had forgotten that in America, Father Christmas was called Santa Clause, but he figured that the jovial Christmas spirit would have to help him regardless of what name he used. The kids in front of him all asked Santa to bring them new baseball bats or dolls or a puppy. Walter hoped that, since he was asking Santa to help him get a gift for his parents, Santa would be sure to assist. Finally it was his turn. He walked up to Santa and sat down on his lap.

"Fathe–Santa Clause, can I ask you something," he said.

"You already did, my dear boy," thundered Santa Clause, whose round little belly did indeed shake when he laughed. "Ask away, son, ask away."

"Are ghosts real?"

"Of course they're real, dear boy!" laughed Santa. "I'm one of them, in a sense."

"Well, yeah," said Walter. "But I mean, can I see a dead person? You're not dead. Or are you?"

"I'm not *not* dead," replied Santa jovially. "But I see what you mean. Are you scared? Is that it? I'll promise you that for Christmas I will make sure that no ghosts ever harm."

"No," interjected Walter quickly. "That's not what I want. I want to talk to Abraham Lincoln!"

"Ahhh, I see," said Santa. "Well, in a few months, it will be Lincoln's Birthday! That's a holiday here, you know. Maybe I'll talk to the owners and we can see if Lincoln could show up to talk to little boys and girls like you."

"But that's too late!" cried Walter. "I need to talk to him nowwwww! How else am I supposed to give him to my parents?"

"I'm afraid that I don't quite understand you, dear boy. Please excuse me; I have so many other little boys and girls to get to. Would you like a candy cane?" Walter took the candy cane, but not even its sweet flavor could brighten his glum mood on the trolley ride home. His last best hope had failed.

---

Walter moved absently through the Christmas Eve festivities. Dinner, made up of oysters, roast goose, brussels sprouts, and plum pudding, looked delicious, but each bite, pervaded by his overwhelming sense of failure, had tasted bland and dry. Nurse Rebecca had left them to celebrate the holiday with an American extended cousin and her husband, and now the house felt empty.

The Christmas Eve services at St. John's in Lafayette Square started at 11 o'clock, far after Walter's usual bedtime, and so by the time the Whinmores were sitting in their pews on the right-side balcony, Walter was half asleep. He watched the choirmaster stand up and get the attention of the chorus. Walter straightened as they began his favorite hymn.

> *O come, all ye faithful, joyful and triumphant,*
> *O come ye, O come ye, to Bethlehem.*

The brightly-lit church, with all the parishioners having come in from the cold to sing together, almost made Walter forget his disappointment.

Once the hymn ended, Fr. Lattimore began to process in preceded by eight altar boys; two swung thuribles, two carried large candles, one carried the processional cross, one held up high the ornately gilded gospel, and two walked with their hands together to either sides of the priest. The next hymn began. *The Church's one foundation | is Jesus Christ her Lord;* As they slowly made their way up the main aisle, incense from the thurible created a haze over the pews. *She is His new creation, | by water and the word.* The haze began to rise above the pews and spread towards the sides of the church as the chorus reached the last stanza. *Yet she on earth hath union | with God the Three in One.* Fr. Lattimer took his seat in the sanctuary as the smoke rose up into the balcony. *And mystic sweet communion | with those whose rest is won.* The altar boys sat down. *Oh happy ones and holy! | Lord, give us grace that we.* By now the incense had completely filled the interior of the church; the parishioners were surrounded by the great cloud, witnessing the end of the procession. *Like them, the meek and lowly | in love might dwell with thee.* The choir sat down.

Fr. Lattimore began the Service of Lessons and Carols. His sermon was not nearly as interesting to Walter as the music had been, and now Walter could barely keep his eyes open. By the time Communion came around, he was drifting in and out of sleep, dreaming vividly. Once or twice, his dreams invaded the real world; in his sleepiness, Walter was sure he saw dozens of people surrounding the priest at the altar, but after shaking his head and blinking a few times, reality reasserted itself. He wasn't old enough yet to take Communion, but he sat patiently in his seat while adults filed past him. When his parents got back, he snuggled up against his mother and closed his eyes.

When he woke up, his family was in the cab back to their home, the rhythmic clip-clop of the horse's hooves muffled somewhat by the snow. The memory of the bright, warm service had faded and all he had left was his sense of failure.

"I thought that that was lovely, darling, didn't you?" said Mrs. Whinmore to her husband.

"I agree, dear," replied the ambassador. "I especially liked his sermon, although you know that I don't care for all of the bells and whistles and smoke. But, I suppose, if there's a time for it, it would be Christmas. On the whole, very well-done. I would call our first Christmas Eve in America a success."

After a few minutes, the cab arrived at their rowhouse.

"Maybe Father Christmas came already," his mother said to him, trying to excite him. "Shall we see what he's left us?" When the ambassador opened up the door, Walter saw that there was a fire burning in the living room and several presents left out on the floor near the hearth. "Why don't you open one tonight, any one, and you can save the rest for tomorrow."

Walter walked over to the presents. He always liked getting presents, but not even the prospect of tearing asunder the wrapping paper could cheer him up. He had failed to get his parents a ghost. They probably would never believe him. "I don't deserve any presents," he said glumly. "Stay here while I get yours." Walter Whinmore trudged up the stairs to his room. He opened up the door, and walked over to his dresser to pull out the hidden presents.

Downstairs, Ambassador Whinmore kissed his wife beneath the mistletoe that had appeared while they were at the parish. "What a truly marvelous job you've done, dear! Walter's mood is sure to break, and I know that he appreciates all the work. Whom did you get to set out the presents?"

"Me? I didn't do anything—I've been so busy with the parish work. It must have been Nurse Rebecca. I'll ask her about it on Boxing Day."

Walter came running downstairs waving a black top hat in the air.

"Mama! Daddy! I told you, he is real! Mr. Lincoln left me his top hat! And he changed the bowtie I was going to give to Daddy! Now it's all small and black."

"That's lovely, darling," Mrs. Whinmore said as she embraced her son.

"Remind me to give her a raise," the ambassador whispered to his wife.

Outside, the wind stirred up a six-and-a-half-foot tall cloud of snow. It made its way down the street, headed towards the 500 block of 10th, but for a while, it lingered outside of a house on P, between 34th and 35th.`;

async function main() {
  const id = crypto.randomUUID();
  const now = Date.now();

  const post = {
    id,
    slug: "a-christmas-guest",
    title: "A Christmas Guest",
    excerpt: "The lamps along P Street cast long, ominous shadows onto the white ground.",
    content,
    coverImage: "",
    tags: ["stories", "favorites"],
    published: true,
    createdAt: now,
    updatedAt: now,
  };

  await redis.set(postKey(id), post);
  await redis.zadd(POSTS_KEY, { score: now, member: id });

  console.log("Seeded 'A Christmas Guest'");
  console.log(`  ID: ${id}`);
  console.log(`  Slug: a-christmas-guest`);
}

main().catch(console.error);
