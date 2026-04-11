/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_RECOGNITION_STAGE: string
    readonly VITE_STAGE: string
    readonly VITE_DD_APPLICATION_ID?: string
    readonly VITE_DD_CLIENT_TOKEN?: string
    readonly VITE_DD_SERVICE?: string
    readonly VITE_DD_ENV?: string
    readonly VITE_AMPLITUDE_API_KEY?: string
}
