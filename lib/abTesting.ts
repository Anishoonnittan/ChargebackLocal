import AsyncStorage from "@react-native-async-storage/async-storage";

export type ABVariant = "A" | "B";

const storageKeyFor = (experimentKey: string) => `ab_variant:${experimentKey}`;

/**
* Local-only variant assignment.
* - Deterministic per device (stored in AsyncStorage)
* - 50/50 split on first assignment
*/
export async function getOrAssignVariant(experimentKey: string): Promise<ABVariant> {
const storageKey = storageKeyFor(experimentKey);

try {
const existing = await AsyncStorage.getItem(storageKey);
if (existing === "A" || existing === "B") {
return existing;
}
} catch {
// fall through
}

const assigned: ABVariant = Math.random() < 0.5 ? "A" : "B";

try {
await AsyncStorage.setItem(storageKey, assigned);
} catch {
// best-effort
}

return assigned;
}
