// URL Encoding via base62

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export const encodeBase64 = (id: number): string => {
    let num = id;
    let encodedString: string = "";
    while (num > 0) {
        const remainder = num % 62;
        encodedString += CHARS[remainder];
        num = Math.floor(num / 62);
    }
    return encodedString;
}

export const decodeBase64 = (str: string): number => {
    let num: number = 0;

    for (let i = 0; i < str.length; i++) {
        const remainder = CHARS.indexOf(str[i]);
        if (remainder === -1) {
            throw new Error(`Invalid character '${str[i]}' in base62 string`);
        }
        num += remainder * Math.pow(62, i);
    }
    return num;
}
