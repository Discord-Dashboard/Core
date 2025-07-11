import { TextFormTypeBuilder } from "@discord-dashboard/form-types";

export default new TextFormTypeBuilder("test", "Test label", true)
    .withDefault("default value")
    .addErrorCheck(async (ctx) => {
        return { message: "test" };
    })
    .setGetter(async (ctx) => `value for ${ctx.guild?.id}`)
    .build();