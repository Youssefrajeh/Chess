// ===========================
// Simple Chess AI for Hints
// ===========================

class SimpleChessAI {
    constructor() {
        this.pieceValues = {
            pawn: 1,
            knight: 3,
            bishop: 3,
            rook: 5,
            queen: 9,
            king: 0
        };
    }

    // Evaluate a position (positive = good for white, negative = good for black)
    evaluatePosition(game) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (piece) {
                    const value = this.pieceValues[piece.type];
                    score += piece.color === 'white' ? value : -value;
                    
                    // Add positional bonuses
                    score += this.getPositionalBonus(piece, row, col);
                }
            }
        }
        
        return score;
    }

    getPositionalBonus(piece, row, col) {
        let bonus = 0;
        const color = piece.color;
        
        // Center control bonus
        const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
        bonus += (7 - centerDistance) * 0.1;
        
        // Piece specific bonuses
        if (piece.type === 'pawn') {
            // Pawns advance bonus
            bonus += color === 'white' ? (6 - row) * 0.1 : (row - 1) * 0.1;
        } else if (piece.type === 'knight' || piece.type === 'bishop') {
            // Knights and bishops in center
            if (row >= 2 && row <= 5 && col >= 2 && col <= 5) {
                bonus += 0.3;
            }
        }
        
        return color === 'white' ? bonus : -bonus;
    }

    // Find best move for current player
    getBestMove(game, depth = 2) {
        const color = game.currentTurn;
        let bestMove = null;
        let bestScore = color === 'white' ? -Infinity : Infinity;
        
        // Get all possible moves
        const moves = this.getAllPossibleMoves(game);
        
        if (moves.length === 0) return null;
        
        // Evaluate each move
        for (const move of moves) {
            const score = this.evaluateMove(game, move, depth);
            
            if (color === 'white') {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
        }
        
        return {
            move: bestMove,
            score: bestScore
        };
    }

    getAllPossibleMoves(game) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (piece && piece.color === game.currentTurn) {
                    const validMoves = game.getValidMoves(row, col);
                    for (const validMove of validMoves) {
                        moves.push({
                            from: { row, col },
                            to: { row: validMove.row, col: validMove.col }
                        });
                    }
                }
            }
        }
        
        return moves;
    }

    evaluateMove(game, move, depth) {
        // Make the move temporarily
        const fromPiece = game.getPiece(move.from.row, move.from.col);
        const toPiece = game.getPiece(move.to.row, move.to.col);
        
        game.setPiece(move.to.row, move.to.col, fromPiece);
        game.setPiece(move.from.row, move.from.col, null);
        
        let score;
        
        if (depth <= 1) {
            // Base case: evaluate position
            score = this.evaluatePosition(game);
            
            // Bonus for captures
            if (toPiece) {
                score += game.currentTurn === 'white' ? 
                    this.pieceValues[toPiece.type] : 
                    -this.pieceValues[toPiece.type];
            }
        } else {
            // Recursive case: look ahead
            const nextColor = game.currentTurn === 'white' ? 'black' : 'white';
            game.currentTurn = nextColor;
            
            const nextMoves = this.getAllPossibleMoves(game);
            if (nextMoves.length > 0) {
                // Get best opponent response
                const scores = nextMoves.slice(0, 10).map(m => 
                    this.evaluateMove(game, m, depth - 1)
                );
                score = nextColor === 'white' ? 
                    Math.max(...scores) : 
                    Math.min(...scores);
            } else {
                score = this.evaluatePosition(game);
            }
            
            game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';
        }
        
        // Undo the move
        game.setPiece(move.from.row, move.from.col, fromPiece);
        game.setPiece(move.to.row, move.to.col, toPiece);
        
        return score;
    }

    formatMove(move) {
        const files = 'abcdefgh';
        const from = files[move.from.col] + (8 - move.from.row);
        const to = files[move.to.col] + (8 - move.to.row);
        return `${from} → ${to}`;
    }
}

// Global AI instance
let simpleAI = null;
