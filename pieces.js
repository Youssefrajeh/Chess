// ===========================
// Chess Piece Sets
// ===========================

const PIECE_SETS = {
    classic: {
        name: 'Classic',
        white: {
            king: '♔',
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘',
            pawn: '♙'
        },
        black: {
            king: '♚',
            queen: '♛',
            rook: '♜',
            bishop: '♝',
            knight: '♞',
            pawn: '♟'
        }
    },
    modern: {
        name: 'Modern',
        white: {
            king: '🗡️',
            queen: '👑',
            rook: '🏛️',
            bishop: '✨',
            knight: '🦄',
            pawn: '⬜'
        },
        black: {
            king: '⚔️',
            queen: '💎',
            rook: '🏰',
            bishop: '🌟',
            knight: '🐴',
            pawn: '⬛'
        }
    },
    bold: {
        name: 'Bold',
        white: {
            king: '♔',
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘',
            pawn: '♙'
        },
        black: {
            king: '♚',
            queen: '♛',
            rook: '♜',
            bishop: '♝',
            knight: '♞',
            pawn: '♟'
        }
    }
};

// Initialize from localStorage or default to classic
let currentPieceStyle = localStorage.getItem('pieceStyle') || 'classic';
let PIECES = PIECE_SETS[currentPieceStyle];

// Function to change piece style
function changePieceStyle(style) {
    if (PIECE_SETS[style]) {
        currentPieceStyle = style;
        PIECES = PIECE_SETS[currentPieceStyle];
        localStorage.setItem('pieceStyle', currentPieceStyle);
        return true;
    }
    return false;
}
