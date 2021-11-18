const key:number = 383,
    NUMBERS:string = '0123456789',
    ASCII_LEN:number = 255;
/**
 * Logic to encode a string for saving it in local store to avoid debugging
 * @param {string} stringToBeEncoded - string to be encoded
 * @returns {string}
 */
export function encodeDataForLocalStore(stringToBeEncoded:string):string{
    if(!encodeDataForLocalStore.length) {
        return '';
    }
    return (
        stringToBeEncoded
        .split("")
        .map((char:string) => {
            let randomNumber:string = NUMBERS[Math.floor(Math.random()*NUMBERS.length)],
                encodedValue:number = char.charCodeAt(0) * key;
            return `${String.fromCharCode(encodedValue % ASCII_LEN)}${randomNumber}${String.fromCharCode(Math.floor(encodedValue/255))}`;
        })
        .join("")
    )
}
/**
 * Logic to decode the encoded string 
 * @param {string} stringToBeDecoded - string to be decoded
 * @returns {string}
 */
export function decodeDataFromLocalStore(stringToBeDecoded:string):string{
    if(!stringToBeDecoded.length) return '';
    let setOfThreeString:RegExpMatchArray|null = stringToBeDecoded.match(/\.{1,3}/g);
    return (
        setOfThreeString ?
        (
            setOfThreeString
            .map((remNumQuo:string) => {
                let [remainder, _ , quotient]:number[] = remNumQuo.split("").map((char:string) => char.charCodeAt(0));
                return `${String.fromCharCode(((ASCII_LEN*quotient) + remainder) / key)}`
            })
            .join("")
        )
        : ''        
    );
}