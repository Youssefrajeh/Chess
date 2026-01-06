// ===========================
// Chess Game Logic
// ===========================
// Note: PIECES constant is loaded from pieces.js

class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.gameStatus = 'playing'; // playing, check, checkmate, stalemate
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.selectedSquare = null;
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.promotionCallback = null;
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Black pieces (row 0, 1)
        board[0] = [
            { type: 'rook', color: 'black' },
            { type: 'knight', color: 'black' },
            { type: 'bishop', color: 'black' },
            { type: 'queen', color: 'black' },
            { type: 'king', color: 'black' },
            { type: 'bishop', color: 'black' },
            { type: 'knight', color: 'black' },
            { type: 'rook', color: 'black' }
        ];
        board[1] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' }));

        // White pieces (row 6, 7)
        board[6] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' }));
        board[7] = [
            { type: 'rook', color: 'white' },
            { type: 'knight', color: 'white' },
            { type: 'bishop', color: 'white' },
            { type: 'queen', color: 'white' },
            { type: 'king', color: 'white' },
            { type: 'bishop', color: 'white' },
            { type: 'knight', color: 'white' },
            { type: 'rook', color: 'white' }
        ];

        return board;
    }

    getPiece(row, col) {
        return this.board[row]?.[col];
    }

    setPiece(row, col, piece) {
        this.board[row][col] = piece;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentTurn) return [];

        let moves = [];

        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }

        // Filter out moves that would leave king in check
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, piece.color));
    }

    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Forward move
        if (!this.getPiece(row + direction, col)) {
            moves.push({ row: row + direction, col });

            // Double move from start
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col });
            }
        }

        // Captures
        [-1, 1].forEach(offset => {
            const targetRow = row + direction;
            const targetCol = col + offset;
            const target = this.getPiece(targetRow, targetCol);
            
            if (target && target.color !== color) {
                moves.push({ row: targetRow, col: targetCol });
            }

            // En passant
            if (this.enPassantTarget && 
                this.enPassantTarget.row === targetRow && 
                this.enPassantTarget.col === targetCol) {
                moves.push({ row: targetRow, col: targetCol, enPassant: true });
            }
        });

        return moves;
    }

    getRookMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }

    getBishopMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }

    getQueenMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }

    getLinearMoves(row, col, color, directions) {
        const moves = [];

        directions.forEach(([dRow, dCol]) => {
            let newRow = row + dRow;
            let newCol = col + dCol;

            while (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }

                newRow += dRow;
                newCol += dCol;
            }
        });

        return moves;
    }

    getKnightMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        offsets.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        return moves;
    }

    getKingMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        offsets.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        // Castling
        const castling = this.getCastlingMoves(row, col, color);
        moves.push(...castling);

        return moves;
    }

    getCastlingMoves(row, col, color) {
        const moves = [];
        
        if (this.isInCheck(color)) return moves;

        const rights = this.castlingRights[color];
        const baseRow = color === 'white' ? 7 : 0;

        // King side castling
        if (rights.kingSide) {
            if (!this.getPiece(baseRow, 5) && 
                !this.getPiece(baseRow, 6) &&
                !this.isSquareUnderAttack(baseRow, 5, color) &&
                !this.isSquareUnderAttack(baseRow, 6, color)) {
                moves.push({ row: baseRow, col: 6, castling: 'kingSide' });
            }
        }

        // Queen side castling
        if (rights.queenSide) {
            if (!this.getPiece(baseRow, 1) && 
                !this.getPiece(baseRow, 2) && 
                !this.getPiece(baseRow, 3) &&
                !this.isSquareUnderAttack(baseRow, 2, color) &&
                !this.isSquareUnderAttack(baseRow, 3, color)) {
                moves.push({ row: baseRow, col: 2, castling: 'queenSide' });
            }
        }

        return moves;
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isSquareUnderAttack(row, col, defenderColor) {
        const attackerColor = defenderColor === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === attackerColor) {
                    const moves = this.getRawMoves(r, c, piece);
                    if (moves.some(move => move.row === row && move.col === col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getRawMoves(row, col, piece) {
        // Get moves without check validation (to avoid infinite recursion)
        switch (piece.type) {
            case 'pawn':
                return this.getPawnMoves(row, col, piece.color).filter(m => !m.enPassant);
            case 'rook':
                return this.getRookMoves(row, col, piece.color);
            case 'knight':
                return this.getKnightMoves(row, col, piece.color);
            case 'bishop':
                return this.getBishopMoves(row, col, piece.color);
            case 'queen':
                return this.getQueenMoves(row, col, piece.color);
            case 'king':
                // King moves without castling for attack detection
                const moves = [];
                const offsets = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1], [0, 1],
                    [1, -1], [1, 0], [1, 1]
                ];
                offsets.forEach(([dRow, dCol]) => {
                    const newRow = row + dRow;
                    const newCol = col + dCol;
                    if (this.isValidPosition(newRow, newCol)) {
                        const target = this.getPiece(newRow, newCol);
                        if (!target || target.color !== piece.color) {
                            moves.push({ row: newRow, col: newCol });
                        }
                    }
                });
                return moves;
            default:
                return [];
        }
    }

    isInCheck(color) {
        const king = this.findKing(color);
        if (!king) return false;
        return this.isSquareUnderAttack(king.row, king.col, color);
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Simulate the move
        const piece = this.getPiece(fromRow, fromCol);
        const capturedPiece = this.getPiece(toRow, toCol);
        
        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        const inCheck = this.isInCheck(color);

        // Undo the move
        this.setPiece(fromRow, fromCol, piece);
        this.setPiece(toRow, toCol, capturedPiece);

        return inCheck;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        const validMoves = this.getValidMoves(fromRow, fromCol);
        const move = validMoves.find(m => m.row === toRow && m.col === toCol);
        
        if (!move) return false;

        // Handle castling
        if (move.castling) {
            return this.performCastling(fromRow, fromCol, toRow, toCol, move.castling);
        }

        // Handle en passant
        if (move.enPassant) {
            const capturedRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            const capturedPiece = this.getPiece(capturedRow, toCol);
            this.capturedPieces[piece.color].push(capturedPiece.type);
            this.setPiece(capturedRow, toCol, null);
        }

        // Capture
        const capturedPiece = this.getPiece(toRow, toCol);
        if (capturedPiece) {
            this.capturedPieces[piece.color].push(capturedPiece.type);
        }

        // Record move
        const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece);
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: capturedPiece,
            notation: moveNotation,
            enPassantTarget: this.enPassantTarget,
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights))
        });

        // Set en passant target
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = {
                row: (fromRow + toRow) / 2,
                col: toCol
            };
        } else {
            this.enPassantTarget = null;
        }

        // Update castling rights
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        } else if (piece.type === 'rook') {
            const baseRow = piece.color === 'white' ? 7 : 0;
            if (fromRow === baseRow) {
                if (fromCol === 0) this.castlingRights[piece.color].queenSide = false;
                if (fromCol === 7) this.castlingRights[piece.color].kingSide = false;
            }
        }

        // Move piece
        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        // Check for pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            return 'promotion';
        }

        // Switch turn
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.updateGameStatus();

        return true;
    }

    performCastling(fromRow, fromCol, toRow, toCol, side) {
        const piece = this.getPiece(fromRow, fromCol);
        const rookCol = side === 'kingSide' ? 7 : 0;
        const rookNewCol = side === 'kingSide' ? 5 : 3;
        const rook = this.getPiece(fromRow, rookCol);

        // Move king and rook
        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);
        this.setPiece(fromRow, rookNewCol, rook);
        this.setPiece(fromRow, rookCol, null);

        // Update castling rights
        this.castlingRights[piece.color].kingSide = false;
        this.castlingRights[piece.color].queenSide = false;

        // Record move
        const notation = side === 'kingSide' ? 'O-O' : 'O-O-O';
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: null,
            notation,
            castling: side,
            enPassantTarget: this.enPassantTarget,
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights))
        });

        this.enPassantTarget = null;
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.updateGameStatus();

        return true;
    }

    promotePawn(row, col, newType) {
        const piece = this.getPiece(row, col);
        if (piece && piece.type === 'pawn') {
            this.setPiece(row, col, { type: newType, color: piece.color });
            this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
            this.updateGameStatus();
            return true;
        }
        return false;
    }

    updateGameStatus() {
        const opponent = this.currentTurn;
        const inCheck = this.isInCheck(opponent);
        const hasLegalMoves = this.hasLegalMoves(opponent);

        if (inCheck && !hasLegalMoves) {
            this.gameStatus = 'checkmate';
        } else if (!inCheck && !hasLegalMoves) {
            this.gameStatus = 'stalemate';
        } else if (inCheck) {
            this.gameStatus = 'check';
        } else {
            this.gameStatus = 'playing';
        }
    }

    hasLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return false;

        const lastMove = this.moveHistory.pop();
        
        // Restore piece
        this.setPiece(lastMove.from.row, lastMove.from.col, lastMove.piece);
        
        // Restore captured piece or clear destination
        if (lastMove.castling) {
            // Undo castling
            const rookCol = lastMove.castling === 'kingSide' ? 7 : 0;
            const rookNewCol = lastMove.castling === 'kingSide' ? 5 : 3;
            const rook = this.getPiece(lastMove.from.row, rookNewCol);
            this.setPiece(lastMove.from.row, rookCol, rook);
            this.setPiece(lastMove.from.row, rookNewCol, null);
            this.setPiece(lastMove.to.row, lastMove.to.col, null);
        } else {
            this.setPiece(lastMove.to.row, lastMove.to.col, lastMove.captured);
        }

        // Restore en passant capture
        if (lastMove.notation.includes('e.p.')) {
            const capturedRow = lastMove.piece.color === 'white' ? lastMove.to.row + 1 : lastMove.to.row - 1;
            const enemyColor = lastMove.piece.color === 'white' ? 'black' : 'white';
            this.setPiece(capturedRow, lastMove.to.col, { type: 'pawn', color: enemyColor });
            this.capturedPieces[lastMove.piece.color].pop();
        } else if (lastMove.captured) {
            this.capturedPieces[lastMove.piece.color].pop();
        }

        // Restore state
        this.enPassantTarget = lastMove.enPassantTarget;
        this.castlingRights = lastMove.castlingRights;
        this.currentTurn = lastMove.piece.color;
        this.gameStatus = 'playing';

        return true;
    }

    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured) {
        const files = 'abcdefgh';
        const pieceSymbol = piece.type === 'pawn' ? '' : piece.type[0].toUpperCase();
        const captureSymbol = captured ? 'x' : '';
        const destination = files[toCol] + (8 - toRow);
        
        return `${pieceSymbol}${captureSymbol}${destination}`;
    }

    reset() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.gameStatus = 'playing';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.selectedSquare = null;
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
    }
}
