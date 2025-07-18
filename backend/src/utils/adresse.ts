export type AddressParts = {
    houseNumber: string;
    streetName: string;
};

export function parseAddress(address: string): AddressParts {
    const match = address.trim().match(/^(\d+\w*)\s+(.*)$/);
    if (!match) {
        throw new Error(`Invalid address format: "${address}"`);
    }

    const [, houseNumber, streetName] = match;
    return { houseNumber, streetName };
}