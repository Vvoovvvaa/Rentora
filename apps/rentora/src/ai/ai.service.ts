import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { Property } from '@app/common-rentora/database/entity';
import { SearchPropertiesArgs } from '@app/common-rentora/interfaces/ai-search-property-interface';

import { RENTORA_AI_INSTRUCTIONS } from './instruction/instructions';
import { AiChatDto } from './dto/ai-chat-dto';
import { SEARCH_PROPERTIES_TOOL } from './tools/property-search.tool';

import { SearchService } from '../search/search.service';
import { SearchDto } from '../search/dto/search.dto';

@Injectable()
export class AiService {
    private readonly openai: OpenAI;
    private readonly model: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly searchService: SearchService,
    ) {
        this.openai = new OpenAI({
            apiKey:
                this.configService.getOrThrow<string>(
                    'OPENAI_API_KEY',
                ),
        });

        this.model =
            this.configService.getOrThrow<string>(
                'OPENAI_MODEL',
            );
    }

    async chat(dto: AiChatDto) {
        const response =
            await this.openai.responses.create({
                model: this.model,

                instructions:
                    RENTORA_AI_INSTRUCTIONS,

                input: dto.message,

                ...(dto.previousResponseId
                    ? {
                          previous_response_id:
                              dto.previousResponseId,
                      }
                    : {}),

                tools: [
                    SEARCH_PROPERTIES_TOOL,
                ],

                parallel_tool_calls: false,
            });

        const functionCall =
            response.output.find(
                (item) =>
                    item.type ===
                    'function_call',
            );

        /*
         * The model answered normally
         * and did not need to search
         * Rentora properties.
         */
        if (!functionCall) {
            return {
                message:
                    response.output_text,

                properties: [],

                total: 0,

                responseId:
                    response.id,
            };
        }

        if (
            functionCall.name !==
            'search_properties'
        ) {
            return {
                message:
                    'Unsupported AI tool',

                properties: [],

                total: 0,

                responseId:
                    response.id,
            };
        }

        const args =
            JSON.parse(
                functionCall.arguments,
            ) as SearchPropertiesArgs;

        const searchDto =
            this.mapAiArgsToSearchDto(
                args,
            );

        const properties =
            await this.searchService.searchProperties(
                searchDto,
            );

        const aiProperties =
            properties
                .slice(0, 10)
                .map(
                    (property) =>
                        this.serializePropertyForAi(
                            property,
                        ),
                );

        const toolResult = {
            total:
                properties.length,

            returned:
                aiProperties.length,

            filters: args,

            properties:
                aiProperties,
        };

        /*
         * Give the real Rentora
         * search results back to the model.
         *
         * previous_response_id links this
         * output to the function call above.
         */
        const finalResponse =
            await this.openai.responses.create({
                model:
                    this.model,

                instructions:
                    RENTORA_AI_INSTRUCTIONS,

                previous_response_id:
                    response.id,

                tools: [
                    SEARCH_PROPERTIES_TOOL,
                ],

                parallel_tool_calls:
                    false,

                input: [
                    {
                        type:
                            'function_call_output',

                        call_id:
                            functionCall.call_id,

                        output:
                            JSON.stringify(
                                toolResult,
                            ),
                    },
                ],
            });

        /*
         * THIS RETURN WAS MISSING.
         *
         * Without it NestJS had no proper
         * AI response to send to frontend.
         */
        return {
            message:
                finalResponse.output_text,

            properties:
                aiProperties,

            total:
                properties.length,

            responseId:
                finalResponse.id,
        };
    }

    private mapAiArgsToSearchDto(
        args: SearchPropertiesArgs,
    ): SearchDto {
        const dto =
            new SearchDto();

        const filters =
            Object.fromEntries(
                Object.entries(
                    args,
                ).filter(
                    ([, value]) =>
                        value !== null,
                ),
            );

        Object.assign(
            dto,
            filters,
        );

        return dto;
    }

    private serializePropertyForAi(
        property: Property,
    ) {
        return {
            id:
                property.id,

            title:
                property.title,

            description:
                property.description
                    ?.slice(
                        0,
                        300,
                    ) ??
                null,

            city:
                property.city,

            address:
                property.address,

            category:
                property.category,

            listing:
                property.listing,

            price:
                property.price,

            currency:
                property.currency,

            rooms:
                property.rooms,

            bedrooms:
                property.bedrooms,

            bathrooms:
                property.bathrooms,

            area:
                property.area,

            floor:
                property.floor,

            totalFloors:
                property.totalFloors,

            constructionYear:
                property.constructionYear,

            condition:
                property.condition,

            buildingType:
                property.buildingType,

            features:
                property.features,

            image:
                property.images?.[0]
                    ?.url ??
                null,
        };
    }
}