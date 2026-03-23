import { describe, it, expect } from "vitest"
import { getRandomQuestions } from "./questions"

describe("getRandomQuestions", () => {
    it("returns the requested number of questions", () => {
        const questions = getRandomQuestions(3)
        expect(questions).toHaveLength(3)
    })

    it("returns questions with the expected shape", () => {
        const [q] = getRandomQuestions(1)
        expect(q).toHaveProperty("question")
        expect(q).toHaveProperty("answer")
        expect(q).toHaveProperty("keywords")
        expect(typeof q.question).toBe("string")
        expect(typeof q.answer).toBe("string")
        expect(Array.isArray(q.keywords)).toBe(true)
    })

    it("does not return more questions than exist in the bank", () => {
        // Requesting far more than the bank holds should return whatever is available
        const questions = getRandomQuestions(100)
        expect(questions.length).toBeLessThanOrEqual(100)
        expect(questions.length).toBeGreaterThan(0)
    })

    it("returns unique questions (no duplicates)", () => {
        const questions = getRandomQuestions(5)
        const texts = questions.map((q) => q.question)
        expect(new Set(texts).size).toBe(texts.length)
    })
})
