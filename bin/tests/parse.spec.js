import { describe, it, expect } from "vitest";
import { parseRollExpression, parseTraitExpression } from "../utils/parse.js";
describe("parseRollExpression", () => {
    describe("basic dice parsing", () => {
        it("should parse simple dice notation", () => {
            const result = parseRollExpression("2d6");
            expect(result.expressions).toHaveLength(1);
            expect(result.expressions[0]?.diceGroups).toHaveLength(1);
            expect(result.expressions[0]?.diceGroups[0]?.group).toEqual({ quantity: 2, sides: 6 });
            expect(result.expressions[0]?.diceGroups[0]?.operator).toBe("+");
            expect(result.validationMessages).toHaveLength(0);
        });
        it("should parse dice with exploding modifiers", () => {
            const result = parseRollExpression("3d8!");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.exploding).toBe(true);
            expect(group?.infinite).toBe(false);
            expect(group?.explodingNumber).toBe(8);
        });
        it("should parse dice with infinite exploding", () => {
            const result = parseRollExpression("2d10!!");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.exploding).toBe(true);
            expect(group?.infinite).toBe(true);
            expect(group?.explodingNumber).toBe(10);
        });
        it("should parse dice with custom exploding threshold", () => {
            const result = parseRollExpression("4d6!>5");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.exploding).toBe(true);
            expect(group?.explodingNumber).toBe(5);
        });
    });
    describe("keep/drop modifiers", () => {
        it("should parse keep highest", () => {
            const result = parseRollExpression("4d6kh3");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.keepHighest).toBe(3);
        });
        it("should parse keep lowest", () => {
            const result = parseRollExpression("4d6kl2");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.keepLowest).toBe(2);
        });
        it("should parse drop highest", () => {
            const result = parseRollExpression("5d8dh2");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.dropHighest).toBe(2);
        });
        it("should parse drop lowest", () => {
            const result = parseRollExpression("5d8dl1");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.dropLowest).toBe(1);
        });
        it("should resolve conflicts by preferring keep over drop", () => {
            const result = parseRollExpression("4d6kh2dh1");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.keepHighest).toBe(2);
            expect(group?.dropHighest).toBeUndefined();
            expect(result.validationMessages).toContain("Cannot use both keep and drop modifiers, removing drop modifiers");
        });
        it("should resolve keep highest vs keep lowest conflict", () => {
            const result = parseRollExpression("4d6kh2kl1");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.keepHighest).toBe(2);
            expect(group?.keepLowest).toBeUndefined();
            expect(result.validationMessages).toContain("Cannot keep both highest and lowest, removing keepLowest");
        });
    });
    describe("complex expressions", () => {
        it("should parse multiple dice groups with operators", () => {
            const result = parseRollExpression("2d6 + 1d8 - 3");
            expect(result.expressions[0]?.diceGroups).toHaveLength(3);
            expect(result.expressions[0]?.diceGroups[0]?.operator).toBe("+");
            expect(result.expressions[0]?.diceGroups[1]?.operator).toBe("+");
            expect(result.expressions[0]?.diceGroups[2]?.operator).toBe("-");
            // Check the modifier (quantity: 0, sides: value)
            expect(result.expressions[0]?.diceGroups[2]?.group).toEqual({ quantity: 0, sides: 3 });
        });
        it("should parse multiple expressions separated by semicolons", () => {
            const result = parseRollExpression("2d6; 1d8; 1d4");
            expect(result.expressions).toHaveLength(3);
            expect(result.expressions[0]?.diceGroups[0]?.group.sides).toBe(6);
            expect(result.expressions[1]?.diceGroups[0]?.group.sides).toBe(8);
            expect(result.expressions[2]?.diceGroups[0]?.group.sides).toBe(4);
        });
        it("should parse multiple expressions separated by commas", () => {
            const result = parseRollExpression("3d4, 2d8, 1d12");
            expect(result.expressions).toHaveLength(3);
            expect(result.expressions[0]?.diceGroups[0]?.group.quantity).toBe(3);
            expect(result.expressions[1]?.diceGroups[0]?.group.quantity).toBe(2);
            expect(result.expressions[2]?.diceGroups[0]?.group.quantity).toBe(1);
        });
    });
    describe("repetition (x pattern)", () => {
        it("should parse repetition pattern", () => {
            const result = parseRollExpression("2d6 x 3");
            expect(result.expressions).toHaveLength(3);
            // All expressions should be identical
            result.expressions.forEach((expr) => {
                expect(expr.diceGroups[0]?.group).toEqual({ quantity: 2, sides: 6 });
            });
        });
        it("should ignore x1 repetition", () => {
            const result = parseRollExpression("2d6 x 1");
            expect(result.expressions).toHaveLength(1);
        });
        it("should handle bare x as x1", () => {
            const result = parseRollExpression("2d6 x");
            expect(result.expressions).toHaveLength(1);
        });
        it("should handle x0 as x1", () => {
            const result = parseRollExpression("2d6 x 0");
            expect(result.expressions).toHaveLength(1);
        });
    });
    describe("target numbers and modifiers", () => {
        it("should parse target number", () => {
            const result = parseRollExpression("2d6 tn8");
            expect(result.targetNumber).toBe(8);
        });
        it("should parse target number with shorthand 't'", () => {
            const result = parseRollExpression("2d6 t8");
            expect(result.targetNumber).toBe(8);
        });
        it("should treat 't' and 'tn' as equivalent", () => {
            const resultTn = parseRollExpression("2d6 tn8");
            const resultT = parseRollExpression("2d6 t8");
            expect(resultTn.targetNumber).toBe(resultT.targetNumber);
        });
        it("should parse global modifier with parentheses", () => {
            const result = parseRollExpression("2d6 (+3)");
            expect(result.globalModifier).toBe(3);
        });
        it("should parse negative global modifier", () => {
            const result = parseRollExpression("2d6 (-2)");
            expect(result.globalModifier).toBe(-2);
        });
        it("should parse unsigned global modifier as positive", () => {
            const result = parseRollExpression("2d6 (4)");
            expect(result.globalModifier).toBe(4);
        });
        it("should parse both target number and global modifier", () => {
            const result = parseRollExpression("2d6 tn8 (+2)");
            expect(result.targetNumber).toBe(8);
            expect(result.globalModifier).toBe(2);
        });
        it("should parse target number shorthand with global modifier", () => {
            const result = parseRollExpression("2d6 t8 (+2)");
            expect(result.targetNumber).toBe(8);
            expect(result.globalModifier).toBe(2);
        });
    });
    describe("validation and error handling", () => {
        it("should validate dice quantity limits", () => {
            const result = parseRollExpression("101d6");
            expect(result.validationMessages).toContain("Invalid quantity 101, must be 1-100");
            expect(result.expressions).toHaveLength(0); // expressions array is cleared on validation failure
        });
        it("should validate dice sides limits", () => {
            const result = parseRollExpression("2d1001");
            expect(result.validationMessages).toContain("Invalid sides 1001, must be 2-1000");
        });
        it("should validate exploding number bounds", () => {
            const result = parseRollExpression("2d6!>7");
            expect(result.validationMessages).toContain("Invalid exploding number 7, must be 2-6, disabling explosions");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.exploding).toBe(false);
        });
        it("should validate keep highest bounds", () => {
            const result = parseRollExpression("3d6kh5");
            expect(result.validationMessages).toContain("Invalid keepHighest 5, must be 1-3");
            const group = result.expressions[0]?.diceGroups[0]?.group;
            expect(group?.keepHighest).toBeUndefined();
        });
        it("should validate total dice groups limit", () => {
            // Create an expression with too many dice groups (over 100)
            const manyDice = Array(102).fill("1d6").join(" + ");
            const result = parseRollExpression(manyDice);
            expect(result.validationMessages).toContain("Too many dice groups: 102, maximum is 100");
            expect(result.expressions).toHaveLength(0);
        });
        it("should handle completely invalid input", () => {
            const result = parseRollExpression("invalid dice expression");
            expect(result.validationMessages.length).toBeGreaterThan(0);
        });
        it("should default to 1d6 for empty expression", () => {
            const result = parseRollExpression("");
            expect(result.expressions).toHaveLength(1);
            expect(result.expressions[0]?.diceGroups[0]?.group).toEqual({ quantity: 1, sides: 6 });
        });
    });
    describe("whitespace handling", () => {
        it("should handle various whitespace patterns", () => {
            const result1 = parseRollExpression("2d6+3");
            const result2 = parseRollExpression("2d6 + 3");
            const result3 = parseRollExpression("  2d6  +  3  ");
            // All should parse identically
            expect(result1.expressions[0]?.diceGroups).toHaveLength(2);
            expect(result2.expressions[0]?.diceGroups).toHaveLength(2);
            expect(result3.expressions[0]?.diceGroups).toHaveLength(2);
        });
        it("should handle whitespace in x pattern", () => {
            // Test all whitespace patterns - should work consistently
            const result1 = parseRollExpression("2d6x3"); // no space
            const result2 = parseRollExpression("2d6 x3"); // space before x
            const result3 = parseRollExpression("2d6 x 3"); // spaces around x
            const result4 = parseRollExpression("2d6  x  3"); // multiple spaces
            // All should produce 3 expressions
            expect(result1.expressions).toHaveLength(3);
            expect(result2.expressions).toHaveLength(3);
            expect(result3.expressions).toHaveLength(3);
            expect(result4.expressions).toHaveLength(3);
        });
    });
    describe("modifier order independence", () => {
        it("should parse x modifier anywhere in expression with kh", () => {
            // All these should be equivalent
            const result1 = parseRollExpression("5d6! x6 kh3 tn10");
            const result2 = parseRollExpression("5d6! kh3 x6 tn10");
            const result3 = parseRollExpression("5d6! kh3 tn10 x6");
            const result4 = parseRollExpression("x6 5d6! kh3 tn10");
            // All should create 6 expressions
            expect(result1.expressions).toHaveLength(6);
            expect(result2.expressions).toHaveLength(6);
            expect(result3.expressions).toHaveLength(6);
            expect(result4.expressions).toHaveLength(6);
            // All should have the same dice spec
            const group1 = result1.expressions[0]?.diceGroups[0]?.group;
            const group2 = result2.expressions[0]?.diceGroups[0]?.group;
            const group3 = result3.expressions[0]?.diceGroups[0]?.group;
            const group4 = result4.expressions[0]?.diceGroups[0]?.group;
            expect(group1).toEqual(group2);
            expect(group1).toEqual(group3);
            expect(group1).toEqual(group4);
            expect(group1?.quantity).toBe(5);
            expect(group1?.sides).toBe(6);
            expect(group1?.exploding).toBe(true);
            expect(group1?.keepHighest).toBe(3);
            // All should have the same target number
            expect(result1.targetNumber).toBe(10);
            expect(result2.targetNumber).toBe(10);
            expect(result3.targetNumber).toBe(10);
            expect(result4.targetNumber).toBe(10);
        });
        it("should parse tn and global modifier in any order", () => {
            const result1 = parseRollExpression("2d6 tn8 (+2)");
            const result2 = parseRollExpression("2d6 (+2) tn8");
            expect(result1.targetNumber).toBe(8);
            expect(result2.targetNumber).toBe(8);
            expect(result1.globalModifier).toBe(2);
            expect(result2.globalModifier).toBe(2);
            // Dice specs should be identical
            expect(result1.expressions[0]?.diceGroups[0]?.group).toEqual(result2.expressions[0]?.diceGroups[0]?.group);
        });
        it("should parse x modifier with complex expressions", () => {
            // x can be anywhere with multiple modifiers
            const result1 = parseRollExpression("4d8! kh3 x2 tn6 (+2)");
            const result2 = parseRollExpression("x2 4d8! kh3 tn6 (+2)");
            const result3 = parseRollExpression("4d8! kh3 tn6 (+2) x2");
            // All should create 2 expressions
            expect(result1.expressions).toHaveLength(2);
            expect(result2.expressions).toHaveLength(2);
            expect(result3.expressions).toHaveLength(2);
            // All should have identical specs
            expect(result1.targetNumber).toBe(6);
            expect(result2.targetNumber).toBe(6);
            expect(result3.targetNumber).toBe(6);
            expect(result1.globalModifier).toBe(2);
            expect(result2.globalModifier).toBe(2);
            expect(result3.globalModifier).toBe(2);
            const group1 = result1.expressions[0]?.diceGroups[0]?.group;
            const group2 = result2.expressions[0]?.diceGroups[0]?.group;
            const group3 = result3.expressions[0]?.diceGroups[0]?.group;
            expect(group1).toEqual(group2);
            expect(group1).toEqual(group3);
        });
        it("should parse dice modifiers independent of position", () => {
            // kh, tn, and ! should work in any order
            const result1 = parseRollExpression("4d6! kh2 tn4");
            const result2 = parseRollExpression("4d6 kh2 ! tn4");
            const result3 = parseRollExpression("4d6 tn4 kh2 !");
            const group1 = result1.expressions[0]?.diceGroups[0]?.group;
            const group2 = result2.expressions[0]?.diceGroups[0]?.group;
            const group3 = result3.expressions[0]?.diceGroups[0]?.group;
            // All should have same properties
            expect(group1?.exploding).toBe(true);
            expect(group2?.exploding).toBe(true);
            expect(group3?.exploding).toBe(true);
            expect(group1?.keepHighest).toBe(2);
            expect(group2?.keepHighest).toBe(2);
            expect(group3?.keepHighest).toBe(2);
            expect(result1.targetNumber).toBe(4);
            expect(result2.targetNumber).toBe(4);
            expect(result3.targetNumber).toBe(4);
        });
        it("should handle x pattern with multiple expressions in different orders", () => {
            const result1 = parseRollExpression("x3 1d6,2d8,3d10");
            const result2 = parseRollExpression("1d6,2d8,3d10 x3");
            // Both should create 9 expressions total (3 original × 3 repetitions)
            expect(result1.expressions).toHaveLength(9);
            expect(result2.expressions).toHaveLength(9);
            // First expression in each group should be identical
            expect(result1.expressions[0]?.diceGroups[0]?.group).toEqual(result2.expressions[0]?.diceGroups[0]?.group);
            expect(result1.expressions[3]?.diceGroups[0]?.group).toEqual(result2.expressions[3]?.diceGroups[0]?.group);
            expect(result1.expressions[6]?.diceGroups[0]?.group).toEqual(result2.expressions[6]?.diceGroups[0]?.group);
        });
    });
});
describe("parseTraitExpression", () => {
    describe("basic trait parsing", () => {
        it("should parse simple trait die", () => {
            const result = parseTraitExpression("d8");
            expect(result.traitDie).toEqual({
                quantity: 1,
                sides: 8,
                exploding: true,
                infinite: true,
                explodingNumber: 8,
            });
            expect(result.wildDie).toEqual({
                quantity: 1,
                sides: 6,
                exploding: true,
                infinite: true,
                explodingNumber: 6,
            });
            expect(result.targetNumber).toBe(4);
            expect(result.validationMessages).toHaveLength(0);
        });
        it("should parse custom wild die", () => {
            const result = parseTraitExpression("d10 wd8");
            expect(result.traitDie.sides).toBe(10);
            expect(result.wildDie.sides).toBe(8);
        });
        it("should parse target number", () => {
            const result = parseTraitExpression("d8 tn6");
            expect(result.targetNumber).toBe(6);
        });
        it("should parse target number with shorthand 't'", () => {
            const result = parseTraitExpression("d8 t6");
            expect(result.targetNumber).toBe(6);
        });
        it("should treat 't' and 'tn' as equivalent in trait expressions", () => {
            const resultTn = parseTraitExpression("d8 tn6");
            const resultT = parseTraitExpression("d8 t6");
            expect(resultTn.targetNumber).toBe(resultT.targetNumber);
        });
        it("should parse target highest", () => {
            const result = parseTraitExpression("d8 th2");
            expect(result.targetHighest).toBe(2);
        });
        it("should distinguish between 't' (target number) and 'th' (target highest)", () => {
            const resultT = parseTraitExpression("d8 t6");
            const resultTh = parseTraitExpression("d8 th2");
            expect(resultT.targetNumber).toBe(6);
            expect(resultT.targetHighest).toBe(1); // default
            expect(resultTh.targetNumber).toBe(4); // default
            expect(resultTh.targetHighest).toBe(2);
        });
        it("should parse both target number shorthand and target highest", () => {
            const result = parseTraitExpression("d8 t6 th2");
            expect(result.targetNumber).toBe(6);
            expect(result.targetHighest).toBe(2);
        });
    });
    describe("modifier handling", () => {
        it("should parse inline modifier", () => {
            const result = parseTraitExpression("d8+2");
            expect(result.globalModifier).toBe(2);
        });
        it("should parse negative inline modifier", () => {
            const result = parseTraitExpression("d8-3");
            expect(result.globalModifier).toBe(-3);
        });
        it("should parse parenthetical modifier", () => {
            const result = parseTraitExpression("d8 (+4)");
            expect(result.globalModifier).toBe(4);
        });
        it("should prioritize inline modifier over parenthetical", () => {
            const result = parseTraitExpression("d8+2 (+4)");
            expect(result.globalModifier).toBe(2); // inline takes precedence
        });
        it("should parse just a modifier as global modifier", () => {
            const result = parseTraitExpression("+3");
            expect(result.globalModifier).toBe(3);
            expect(result.traitDie.sides).toBe(4); // default d4
        });
    });
    describe("validation", () => {
        it("should validate trait die quantity must be 1", () => {
            const result = parseTraitExpression("3d8");
            expect(result.validationMessages).toContain("Trait die quantity must be 1, got 3");
        });
        it("should validate trait die sides bounds", () => {
            const result = parseTraitExpression("d1001");
            expect(result.validationMessages).toContain("Invalid trait die sides 1001, must be 2-100");
        });
        it("should validate wild die sides bounds", () => {
            const result = parseTraitExpression("d8 wd101");
            expect(result.validationMessages).toContain("Invalid wild die sides 101, must be 2-100");
        });
        it("should handle empty expression with defaults", () => {
            const result = parseTraitExpression("");
            expect(result.traitDie.sides).toBe(4);
            expect(result.wildDie.sides).toBe(6);
            expect(result.targetNumber).toBe(4);
            expect(result.validationMessages).toHaveLength(0);
        });
    });
    describe("complex trait expressions", () => {
        it("should parse all modifiers together", () => {
            const result = parseTraitExpression("d12+3 wd8 tn8 th1");
            expect(result.traitDie.sides).toBe(12);
            expect(result.wildDie.sides).toBe(8);
            expect(result.globalModifier).toBe(3);
            expect(result.targetNumber).toBe(8);
            expect(result.targetHighest).toBe(1);
        });
        it("should handle whitespace variations", () => {
            const result1 = parseTraitExpression("d8+2tn6");
            const result2 = parseTraitExpression("d8 + 2 tn 6");
            const result3 = parseTraitExpression("  d8  +  2  tn  6  ");
            // All should parse identically
            expect(result1.globalModifier).toBe(2);
            expect(result1.targetNumber).toBe(6);
            expect(result2.globalModifier).toBe(2);
            expect(result2.targetNumber).toBe(6);
            expect(result3.globalModifier).toBe(2);
            expect(result3.targetNumber).toBe(6);
        });
    });
    describe("trait modifier order independence", () => {
        it("should parse trait modifiers in any order when modifier is attached to die", () => {
            // Modifier must be attached to die spec (d8+2), but wd, tn can be anywhere
            const result1 = parseTraitExpression("d8+2 wd6 tn4");
            const result2 = parseTraitExpression("d8+2 tn4 wd6");
            const result3 = parseTraitExpression("wd6 d8+2 tn4");
            const result4 = parseTraitExpression("tn4 d8+2 wd6");
            // All should have the same trait die
            expect(result1.traitDie.sides).toBe(8);
            expect(result2.traitDie.sides).toBe(8);
            expect(result3.traitDie.sides).toBe(8);
            expect(result4.traitDie.sides).toBe(8);
            // All should have the same wild die
            expect(result1.wildDie.sides).toBe(6);
            expect(result2.wildDie.sides).toBe(6);
            expect(result3.wildDie.sides).toBe(6);
            expect(result4.wildDie.sides).toBe(6);
            // All should have the same target number
            expect(result1.targetNumber).toBe(4);
            expect(result2.targetNumber).toBe(4);
            expect(result3.targetNumber).toBe(4);
            expect(result4.targetNumber).toBe(4);
            // All should have the same global modifier
            expect(result1.globalModifier).toBe(2);
            expect(result2.globalModifier).toBe(2);
            expect(result3.globalModifier).toBe(2);
            expect(result4.globalModifier).toBe(2);
        });
        it("should parse th and tn in any order", () => {
            const result1 = parseTraitExpression("d8 th2 tn6");
            const result2 = parseTraitExpression("d8 tn6 th2");
            const result3 = parseTraitExpression("tn6 d8 th2");
            const result4 = parseTraitExpression("th2 tn6 d8");
            expect(result1.targetHighest).toBe(2);
            expect(result2.targetHighest).toBe(2);
            expect(result3.targetHighest).toBe(2);
            expect(result4.targetHighest).toBe(2);
            expect(result1.targetNumber).toBe(6);
            expect(result2.targetNumber).toBe(6);
            expect(result3.targetNumber).toBe(6);
            expect(result4.targetNumber).toBe(6);
        });
        it("should handle all trait modifiers in different orders", () => {
            // Modifier attached to die, other modifiers can be anywhere
            const result1 = parseTraitExpression("d12+3 wd8 tn8 th1");
            const result2 = parseTraitExpression("th1 tn8 d12+3 wd8");
            const result3 = parseTraitExpression("wd8 th1 d12+3 tn8");
            // All should produce identical results
            expect(result1.traitDie.sides).toBe(12);
            expect(result2.traitDie.sides).toBe(12);
            expect(result3.traitDie.sides).toBe(12);
            expect(result1.wildDie.sides).toBe(8);
            expect(result2.wildDie.sides).toBe(8);
            expect(result3.wildDie.sides).toBe(8);
            expect(result1.targetNumber).toBe(8);
            expect(result2.targetNumber).toBe(8);
            expect(result3.targetNumber).toBe(8);
            expect(result1.globalModifier).toBe(3);
            expect(result2.globalModifier).toBe(3);
            expect(result3.globalModifier).toBe(3);
            expect(result1.targetHighest).toBe(1);
            expect(result2.targetHighest).toBe(1);
            expect(result3.targetHighest).toBe(1);
        });
        it("should parse shorthand 't' and full 'tn' equivalently regardless of order", () => {
            const result1 = parseTraitExpression("d8+1 t6");
            const result2 = parseTraitExpression("d8+1 tn6");
            const result3 = parseTraitExpression("t6 d8+1");
            const result4 = parseTraitExpression("tn6 d8+1");
            expect(result1.targetNumber).toBe(6);
            expect(result2.targetNumber).toBe(6);
            expect(result3.targetNumber).toBe(6);
            expect(result4.targetNumber).toBe(6);
            expect(result1.globalModifier).toBe(1);
            expect(result2.globalModifier).toBe(1);
            expect(result3.globalModifier).toBe(1);
            expect(result4.globalModifier).toBe(1);
        });
        it("should parse parenthetical modifier in any order", () => {
            const result1 = parseTraitExpression("d8 (+2) wd6 tn4");
            const result2 = parseTraitExpression("(+2) d8 wd6 tn4");
            const result3 = parseTraitExpression("wd6 d8 (+2) tn4");
            expect(result1.globalModifier).toBe(2);
            expect(result2.globalModifier).toBe(2);
            expect(result3.globalModifier).toBe(2);
            expect(result1.targetNumber).toBe(4);
            expect(result2.targetNumber).toBe(4);
            expect(result3.targetNumber).toBe(4);
        });
    });
});
describe("parser fixture tests", () => {
    // Fixture tests to ensure parsing outputs remain stable
    const fixtures = [
        { input: "2d6 + 3", description: "basic dice with modifier" },
        { input: "4d8! kh3 tn6 (+2)", description: "complex dice with all modifiers" },
        { input: "1d20, 2d6, 3d4 x 2", description: "multiple expressions with repetition" },
        { input: "d8+2 wd6 tn4", description: "trait expression with modifiers" },
        { input: "100d6", description: "maximum dice quantity" },
        { input: "1d1000", description: "maximum dice sides" },
        { input: "invalid expression", description: "invalid input" },
        { input: "", description: "empty input" },
    ];
    fixtures.forEach(({ input, description }) => {
        it(`should produce stable output for: ${description}`, () => {
            if (input.includes("wd") || input.startsWith("d")) {
                // Trait expression
                const result = parseTraitExpression(input);
                expect(result).toMatchSnapshot();
            }
            else {
                // Roll expression
                const result = parseRollExpression(input);
                expect(result).toMatchSnapshot();
            }
        });
    });
});
//# sourceMappingURL=parse.spec.js.map