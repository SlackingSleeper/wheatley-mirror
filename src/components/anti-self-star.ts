import * as Discord from "discord.js";
import { strict as assert } from "assert";
import { M } from "../utils";
import { memes_channel_id, TCCPP_ID } from "../common";
import { BotComponent } from "../bot_component";
import { Wheatley } from "../wheatley";
import { has_media } from "./autoreact";

export class AntiSelfStar extends BotComponent {
    constructor(wheatley: Wheatley) {
        super(wheatley);
    }

    override async on_ready() {
        await this.catch_up();
    }

    override async on_reaction_add(
        reaction: Discord.MessageReaction | Discord.PartialMessageReaction,
        user: Discord.User | Discord.PartialUser
    ): Promise<void> {
        const message = reaction.message;
        if(!message.author) {
            M.warn("message.author is null");
        }
        if(message.channelId == memes_channel_id && user.id == message.author?.id && has_media(message)) {
            M.debug("Deleting self-starred message", [ message.author.id, message.author.tag ]);
            await message.delete();
        }
    }

    async catch_up() {
        const TCCPP = await this.wheatley.client.guilds.fetch(TCCPP_ID);
        const memes_channel = await TCCPP.channels.fetch(memes_channel_id);
        assert(memes_channel);
        assert(memes_channel.type == Discord.ChannelType.GuildText);
        const messages = await memes_channel.messages.fetch({ limit: 100, cache: false });
        for(const [ _, message ] of messages) {
            message.reactions.cache.forEach(async reaction => {
                const users = await reaction.users.fetch();
                for(const [ id, _ ] of users) {
                    if(id == message.author.id && has_media(message)) {
                        M.debug("Deleting self-starred message", [ message.author.id, message.author.tag ]);
                        await message.delete();
                    }
                }
            });
        }
        M.log("Finished catching up on #memes messages");
    }
}
