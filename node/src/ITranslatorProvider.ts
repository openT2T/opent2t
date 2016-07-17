
import { ITranslator } from "./ITranslator";
import { TranslatorInfo } from "./TranslatorInfo";

export interface ITranslatorProvider {
    getTranslatorInfoAsync(translatorId: string, version: string): Promise<TranslatorInfo>;
    getTranslatorAsync(translatorId: string, version: string): Promise<ITranslator>;
}
