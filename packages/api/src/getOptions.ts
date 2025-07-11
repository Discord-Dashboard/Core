import { NextRequest, NextResponse } from 'next/server'
import { loadAllCategories } from '@discord-dashboard/form-types'
import type {FormContext, FormError} from '@discord-dashboard/contracts'
import {getDiscordClient} from "./discordClient";

import HttpErrors from "http-errors"

const client = await getDiscordClient();

export async function GET(
    _req: NextRequest,
    { params }: { params: { guildId: string } }
) {
    const { guildId } = params
    const guild = client.guilds.cache.get(guildId);
    if(!guild) {
        return NextResponse.json(
            new HttpErrors.BadRequest()
        )
    }
    const categories = await loadAllCategories()

    const payload = await Promise.all(
        categories.map(async ({ category, options }) => {
            const opts = await Promise.all(
                options.map(async (optBuilder) => {
                    const ctx: FormContext = { guild }
                    const display = await optBuilder.shouldDisplay(ctx)
                    if (!display) return null

                    const display_errors = await optBuilder.getDisplayErrors(ctx);
                    if(display_errors) {
                        return {
                            ...optBuilder.serialize(),
                            errors: display_errors,
                        }
                    }

                    try {
                        const value = await optBuilder.get(ctx)
                        return {
                            ...optBuilder.serialize(),
                            value,
                        }
                    } catch (err: any) {
                        return {
                            ...optBuilder.serialize(),
                            errors: [err instanceof Error ? { message: err.message } : {message:String(err)}] as FormError[],
                        }
                    }
                })
            )
            return {
                id: category.id,
                label: category.label,
                options: opts.filter((x)=>x !== null),
            }
        })
    )

    return NextResponse.json(payload)
}