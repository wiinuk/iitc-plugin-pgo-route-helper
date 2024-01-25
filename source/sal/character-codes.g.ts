export const enum CharacterCodes {
    /** u+0000 "NULL" */
    NULL = 0x0000,
    /** u+0008 "BACKSPACE" */
    BACKSPACE = 0x0008,
    /** u+0009 "CHARACTER TABULATION" */
    "CHARACTER TABULATION" = 0x0009,
    /** u+000a "LINE FEED (LF)" */
    "LINE FEED (LF)" = 0x000a,
    /** u+000b "LINE TABULATION" */
    "LINE TABULATION" = 0x000b,
    /** u+000c "FORM FEED (FF)" */
    "FORM FEED (FF)" = 0x000c,
    /** u+000d "CARRIAGE RETURN (CR)" */
    "CARRIAGE RETURN (CR)" = 0x000d,
    /** u+001f "INFORMATION SEPARATOR ONE" */
    "INFORMATION SEPARATOR ONE" = 0x001f,
    /** u+0020 "SPACE" */
    SPACE = 0x0020,
    /** u+0021 "EXCLAMATION MARK" */
    "!" = 0x0021,
    /** u+0022 "QUOTATION MARK" */
    '"' = 0x0022,
    /** u+0023 "NUMBER SIGN" */
    "#" = 0x0023,
    /** u+0024 "DOLLAR SIGN" */
    $ = 0x0024,
    /** u+0025 "PERCENT SIGN" */
    "%" = 0x0025,
    /** u+0026 "AMPERSAND" */
    "&" = 0x0026,
    /** u+0027 "APOSTROPHE" */
    "'" = 0x0027,
    /** u+0028 "LEFT PARENTHESIS" */
    "(" = 0x0028,
    /** u+0029 "RIGHT PARENTHESIS" */
    ")" = 0x0029,
    /** u+002a "ASTERISK" */
    "*" = 0x002a,
    /** u+002b "PLUS SIGN" */
    "+" = 0x002b,
    /** u+002c "COMMA" */
    "," = 0x002c,
    /** u+002d "HYPHEN-MINUS" */
    "-" = 0x002d,
    /** u+002e "FULL STOP" */
    "." = 0x002e,
    /** u+002f "SOLIDUS" */
    "/" = 0x002f,
    /** u+0030 "DIGIT ZERO" */
    C0 = 0x0030,
    /** u+0031 "DIGIT ONE" */
    C1 = 0x0031,
    /** u+0032 "DIGIT TWO" */
    C2 = 0x0032,
    /** u+0033 "DIGIT THREE" */
    C3 = 0x0033,
    /** u+0034 "DIGIT FOUR" */
    C4 = 0x0034,
    /** u+0035 "DIGIT FIVE" */
    C5 = 0x0035,
    /** u+0036 "DIGIT SIX" */
    C6 = 0x0036,
    /** u+0037 "DIGIT SEVEN" */
    C7 = 0x0037,
    /** u+0038 "DIGIT EIGHT" */
    C8 = 0x0038,
    /** u+0039 "DIGIT NINE" */
    C9 = 0x0039,
    /** u+003a "COLON" */
    ":" = 0x003a,
    /** u+003b "SEMICOLON" */
    ";" = 0x003b,
    /** u+003c "LESS-THAN SIGN" */
    "<" = 0x003c,
    /** u+003d "EQUALS SIGN" */
    "=" = 0x003d,
    /** u+003e "GREATER-THAN SIGN" */
    ">" = 0x003e,
    /** u+003f "QUESTION MARK" */
    "?" = 0x003f,
    /** u+0040 "COMMERCIAL AT" */
    "@" = 0x0040,
    /** u+0041 "LATIN CAPITAL LETTER A" */
    A = 0x0041,
    /** u+0042 "LATIN CAPITAL LETTER B" */
    B = 0x0042,
    /** u+0043 "LATIN CAPITAL LETTER C" */
    C = 0x0043,
    /** u+0044 "LATIN CAPITAL LETTER D" */
    D = 0x0044,
    /** u+0045 "LATIN CAPITAL LETTER E" */
    E = 0x0045,
    /** u+0046 "LATIN CAPITAL LETTER F" */
    F = 0x0046,
    /** u+0047 "LATIN CAPITAL LETTER G" */
    G = 0x0047,
    /** u+0048 "LATIN CAPITAL LETTER H" */
    H = 0x0048,
    /** u+0049 "LATIN CAPITAL LETTER I" */
    I = 0x0049,
    /** u+004a "LATIN CAPITAL LETTER J" */
    J = 0x004a,
    /** u+004b "LATIN CAPITAL LETTER K" */
    K = 0x004b,
    /** u+004c "LATIN CAPITAL LETTER L" */
    L = 0x004c,
    /** u+004d "LATIN CAPITAL LETTER M" */
    M = 0x004d,
    /** u+004e "LATIN CAPITAL LETTER N" */
    N = 0x004e,
    /** u+004f "LATIN CAPITAL LETTER O" */
    O = 0x004f,
    /** u+0050 "LATIN CAPITAL LETTER P" */
    P = 0x0050,
    /** u+0051 "LATIN CAPITAL LETTER Q" */
    Q = 0x0051,
    /** u+0052 "LATIN CAPITAL LETTER R" */
    R = 0x0052,
    /** u+0053 "LATIN CAPITAL LETTER S" */
    S = 0x0053,
    /** u+0054 "LATIN CAPITAL LETTER T" */
    T = 0x0054,
    /** u+0055 "LATIN CAPITAL LETTER U" */
    U = 0x0055,
    /** u+0056 "LATIN CAPITAL LETTER V" */
    V = 0x0056,
    /** u+0057 "LATIN CAPITAL LETTER W" */
    W = 0x0057,
    /** u+0058 "LATIN CAPITAL LETTER X" */
    X = 0x0058,
    /** u+0059 "LATIN CAPITAL LETTER Y" */
    Y = 0x0059,
    /** u+005a "LATIN CAPITAL LETTER Z" */
    Z = 0x005a,
    /** u+005b "LEFT SQUARE BRACKET" */
    "[" = 0x005b,
    /** u+005c "REVERSE SOLIDUS" */
    "\\" = 0x005c,
    /** u+005d "RIGHT SQUARE BRACKET" */
    "]" = 0x005d,
    /** u+005e "CIRCUMFLEX ACCENT" */
    "^" = 0x005e,
    /** u+005f "LOW LINE" */
    _ = 0x005f,
    /** u+0060 "GRAVE ACCENT" */
    "`" = 0x0060,
    /** u+0061 "LATIN SMALL LETTER A" */
    a = 0x0061,
    /** u+0062 "LATIN SMALL LETTER B" */
    b = 0x0062,
    /** u+0063 "LATIN SMALL LETTER C" */
    c = 0x0063,
    /** u+0064 "LATIN SMALL LETTER D" */
    d = 0x0064,
    /** u+0065 "LATIN SMALL LETTER E" */
    e = 0x0065,
    /** u+0066 "LATIN SMALL LETTER F" */
    f = 0x0066,
    /** u+0067 "LATIN SMALL LETTER G" */
    g = 0x0067,
    /** u+0068 "LATIN SMALL LETTER H" */
    h = 0x0068,
    /** u+0069 "LATIN SMALL LETTER I" */
    i = 0x0069,
    /** u+006a "LATIN SMALL LETTER J" */
    j = 0x006a,
    /** u+006b "LATIN SMALL LETTER K" */
    k = 0x006b,
    /** u+006c "LATIN SMALL LETTER L" */
    l = 0x006c,
    /** u+006d "LATIN SMALL LETTER M" */
    m = 0x006d,
    /** u+006e "LATIN SMALL LETTER N" */
    n = 0x006e,
    /** u+006f "LATIN SMALL LETTER O" */
    o = 0x006f,
    /** u+0070 "LATIN SMALL LETTER P" */
    p = 0x0070,
    /** u+0071 "LATIN SMALL LETTER Q" */
    q = 0x0071,
    /** u+0072 "LATIN SMALL LETTER R" */
    r = 0x0072,
    /** u+0073 "LATIN SMALL LETTER S" */
    s = 0x0073,
    /** u+0074 "LATIN SMALL LETTER T" */
    t = 0x0074,
    /** u+0075 "LATIN SMALL LETTER U" */
    u = 0x0075,
    /** u+0076 "LATIN SMALL LETTER V" */
    v = 0x0076,
    /** u+0077 "LATIN SMALL LETTER W" */
    w = 0x0077,
    /** u+0078 "LATIN SMALL LETTER X" */
    x = 0x0078,
    /** u+0079 "LATIN SMALL LETTER Y" */
    y = 0x0079,
    /** u+007a "LATIN SMALL LETTER Z" */
    z = 0x007a,
    /** u+007b "LEFT CURLY BRACKET" */
    "{" = 0x007b,
    /** u+007c "VERTICAL LINE" */
    "|" = 0x007c,
    /** u+007d "RIGHT CURLY BRACKET" */
    "}" = 0x007d,
    /** u+007e "TILDE" */
    "~" = 0x007e,
    /** u+007f "DELETE" */
    DELETE = 0x007f,
    /** u+009f "APPLICATION PROGRAM COMMAND" */
    "APPLICATION PROGRAM COMMAND" = 0x009f,
    /** u+00a0 "NO-BREAK SPACE" */
    "NO-BREAK SPACE" = 0x00a0,
    /** u+1680 "OGHAM SPACE MARK" */
    "OGHAM SPACE MARK" = 0x1680,
    /** u+2000 "EN QUAD" */
    "EN QUAD" = 0x2000,
    /** u+2001 "EM QUAD" */
    "EM QUAD" = 0x2001,
    /** u+2002 "EN SPACE" */
    "EN SPACE" = 0x2002,
    /** u+2003 "EM SPACE" */
    "EM SPACE" = 0x2003,
    /** u+2004 "THREE-PER-EM SPACE" */
    "THREE-PER-EM SPACE" = 0x2004,
    /** u+2005 "FOUR-PER-EM SPACE" */
    "FOUR-PER-EM SPACE" = 0x2005,
    /** u+2006 "SIX-PER-EM SPACE" */
    "SIX-PER-EM SPACE" = 0x2006,
    /** u+2007 "FIGURE SPACE" */
    "FIGURE SPACE" = 0x2007,
    /** u+2008 "PUNCTUATION SPACE" */
    "PUNCTUATION SPACE" = 0x2008,
    /** u+2009 "THIN SPACE" */
    "THIN SPACE" = 0x2009,
    /** u+200a "HAIR SPACE" */
    "HAIR SPACE" = 0x200a,
    /** u+200b "ZERO WIDTH SPACE" */
    "ZERO WIDTH SPACE" = 0x200b,
    /** u+202f "NARROW NO-BREAK SPACE" */
    "NARROW NO-BREAK SPACE" = 0x202f,
    /** u+205f "MEDIUM MATHEMATICAL SPACE" */
    "MEDIUM MATHEMATICAL SPACE" = 0x205f,
    /** u+3000 "IDEOGRAPHIC SPACE" */
    "IDEOGRAPHIC SPACE" = 0x3000,
    /** u+feff "ZERO WIDTH NO-BREAK SPACE" */
    "ZERO WIDTH NO-BREAK SPACE" = 0xfeff,
}
