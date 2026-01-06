// ===========================
// Stockfish Chess Engine Integration
// ===========================

class ChessEngine {
    constructor() {
        this.stockfish = null;
        this.isReady = false;
        this.currentEvaluation = 0;
        this.bestMove = null;
        this.isAnalyzing = false;
        this.initEngine();
    }

    initEngine() {
        try {
            // Initialize Stockfish
            if (typeof STOCKFISH === 'function') {
                this.stockfish = STOCKFISH();
                this.setupEngineHandlers();
                
                // Configure engine
                this.stockfish.postMessage('uci');
                this.stockfish.postMessage('setoption name Skill Level value 20'); // Maximum strength
                this.stockfish.postMessage('isready');
            } else {
                console.warn('Stockfish not loaded, analysis features disabled');
                this.updateStatus('Engine not available');
            }
        } catch (error) {
            console.error('Failed to initialize Stockfish:', error);
            this.updateStatus('Engine error');
        }
    }

    setupEngineHandlers() {
        this.stockfish.onmessage = (event) => {
            const message = event.data || event;
            
            if (message === 'readyok') {
                this.isReady = true;
                this.updateStatus('Engine ready');
            } else if (message.startsWith('bestmove')) {
                this.handleBestMove(message);
            } else if (message.startsWith('info')) {
                this.handleAnalysisInfo(message);
            }
        };
    }

    handleBestMove(message) {
        // Format: "bestmove e2e4 ponder e7e5"
        const parts = message.split(' ');
        if (parts[1] && parts[1] !== '(none)') {
            this.bestMove = parts[1];
            this.isAnalyzing = false;
            this.displayBestMove(this.bestMove);
        }
    }

    handleAnalysisInfo(message) {
        // Parse evaluation score
        if (message.includes('score cp')) {
            const match = message.match(/score cp (-?\d+)/);
            if (match) {
                this.currentEvaluation = parseInt(match[1]) / 100; // Convert centipawns to pawns
                this.updateEvaluationDisplay();
            }
        } else if (message.includes('score mate')) {
            const match = message.match(/score mate (-?\d+)/);
            if (match) {
                const mateIn = parseInt(match[1]);
                this.currentEvaluation = mateIn > 0 ? 999 : -999;
                this.updateEvaluationDisplay(mateIn);
            }
        }
    }

    analyzePosition(fen) {
        if (!this.isReady || this.isAnalyzing) return;

        this.isAnalyzing = true;
        this.bestMove = null;
        this.updateStatus('Analyzing...');

        // Send position to engine
        this.stockfish.postMessage('position fen ' + fen);
        this.stockfish.postMessage('go depth 15'); // Analyze 15 moves deep
    }

    getBoardFEN(game) {
        // Convert game board to FEN notation
        let fen = '';

        // Board position
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += this.pieceToFEN(piece);
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row < 7) fen += '/';
        }

        // Active color
        fen += ' ' + (game.currentTurn === 'white' ? 'w' : 'b');

        // Castling rights
        let castling = '';
        if (game.castlingRights.white.kingSide) castling += 'K';
        if (game.castlingRights.white.queenSide) castling += 'Q';
        if (game.castlingRights.black.kingSide) castling += 'k';
        if (game.castlingRights.black.queenSide) castling += 'q';
        fen += ' ' + (castling || '-');

        // En passant
        if (game.enPassantTarget) {
            const file = 'abcdefgh'[game.enPassantTarget.col];
            const rank = 8 - game.enPassantTarget.row;
            fen += ' ' + file + rank;
        } else {
            fen += ' -';
        }

        // Halfmove clock and fullmove number (simplified)
        fen += ' 0 ' + (Math.floor(game.moveHistory.length / 2) + 1);

        return fen;
    }

    pieceToFEN(piece) {
        const fenMap = {
            pawn: 'p',
            knight: 'n',
            bishop: 'b',
            rook: 'r',
            queen: 'q',
            king: 'k'
        };
        const char = fenMap[piece.type];
        return piece.color === 'white' ? char.toUpperCase() : char;
    }

    updateEvaluationDisplay(mateIn = null) {
        const evalScore = document.getElementById('eval-score');
        const evalBar = document.getElementById('eval-bar');

        if (mateIn !== null) {
            evalScore.textContent = `M${Math.abs(mateIn)}`;
            evalBar.style.width = mateIn > 0 ? '100%' : '0%';
        } else {
            // Clamp evaluation between -10 and +10 for display
            const clampedEval = Math.max(-10, Math.min(10, this.currentEvaluation));
            evalScore.textContent = (this.currentEvaluation >= 0 ? '+' : '') + this.currentEvaluation.toFixed(1);
            
            // Convert to percentage (0 = black winning, 100 = white winning)
            const percentage = ((clampedEval + 10) / 20) * 100;
            evalBar.style.width = percentage + '%';
        }
    }

    displayBestMove(moveUCI) {
        // Convert UCI notation (e2e4) to readable format
        const fromCol = moveUCI.charCodeAt(0) - 97; // 'a' = 0
        const fromRow = 8 - parseInt(moveUCI[1]);
        const toCol = moveUCI.charCodeAt(2) - 97;
        const toRow = 8 - parseInt(moveUCI[3]);

        const display = document.getElementById('best-move-display');
        display.innerHTML = `
            <div class="best-move-item">
                <span class="move-label">Best Move:</span>
                <span class="move-notation">${this.formatMove(moveUCI)}</span>
                <button id="apply-hint-btn" class="apply-hint-btn">▶ Apply</button>
            </div>
        `;

        // Store move coordinates for application
        display.dataset.fromRow = fromRow;
        display.dataset.fromCol = fromCol;
        display.dataset.toRow = toRow;
        display.dataset.toCol = toCol;

        this.updateStatus('Analysis complete');

        // Add highlight to best move squares
        this.highlightBestMove(fromRow, fromCol, toRow, toCol);
    }

    highlightBestMove(fromRow, fromCol, toRow, toCol) {
        // Remove previous highlights
        document.querySelectorAll('.best-move-highlight').forEach(el => {
            el.classList.remove('best-move-highlight');
        });

        // Add highlights
        const fromSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const toSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toRow}"]`);
        
        if (fromSquare) fromSquare.classList.add('best-move-highlight');
        if (toSquare) toSquare.classList.add('best-move-highlight');
    }

    formatMove(moveUCI) {
        // Convert e2e4 to readable format
        const files = 'abcdefgh';
        const from = moveUCI.substring(0, 2);
        const to = moveUCI.substring(2, 4);
        return `${from} → ${to}`;
    }

    updateStatus(message) {
        const status = document.getElementById('analysis-status');
        if (status) {
            status.textContent = message;
        }
    }

    stop() {
        if (this.stockfish && this.isAnalyzing) {
            this.stockfish.postMessage('stop');
            this.isAnalyzing = false;
        }
    }
}

// Global engine instance (will be initialized by UI)
let chessEngine = null;
