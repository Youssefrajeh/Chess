// ===========================
// Chess Engine Integration
// ===========================

class ChessEngine {
    constructor() {
        this.isReady = true;
        this.currentEvaluation = 0;
        this.bestMove = null;
        this.isAnalyzing = false;
    }

    analyzePosition(game) {
        if (this.isAnalyzing) return;

        this.isAnalyzing = true;
        this.bestMove = null;
        this.updateStatus('Analyzing...');

        // Use simple AI to find best move
        setTimeout(() => {
            try {
                const result = simpleAI.getBestMove(game, 2);
                
                if (result && result.move) {
                    this.currentEvaluation = result.score;
                    this.bestMove = result.move;
                    this.updateEvaluationDisplay();
                    this.displayBestMove(result.move);
                } else {
                    this.updateStatus('No moves available');
                }
            } catch (error) {
                console.error('Analysis error:', error);
                this.updateStatus('Analysis failed');
            }
            
            this.isAnalyzing = false;
        }, 100);
    }

    updateEvaluationDisplay() {
        const evalScore = document.getElementById('eval-score');
        const evalBar = document.getElementById('eval-bar');

        if (!evalScore || !evalBar) return;

        // Clamp evaluation between -10 and +10 for display
        const clampedEval = Math.max(-10, Math.min(10, this.currentEvaluation));
        evalScore.textContent = (this.currentEvaluation >= 0 ? '+' : '') + this.currentEvaluation.toFixed(1);
        
        // Convert to percentage (0 = black winning, 100 = white winning)
        const percentage = ((clampedEval + 10) / 20) * 100;
        evalBar.style.width = percentage + '%';
    }

    displayBestMove(move) {
        const display = document.getElementById('best-move-display');
        if (!display) return;

        display.innerHTML = `
            <div class="best-move-item">
                <span class="move-label">Best Move:</span>
                <span class="move-notation">${simpleAI.formatMove(move)}</span>
                <button id="apply-hint-btn" class="apply-hint-btn">▶ Apply</button>
            </div>
        `;

        // Store move coordinates for application
        display.dataset.fromRow = move.from.row;
        display.dataset.fromCol = move.from.col;
        display.dataset.toRow = move.to.row;
        display.dataset.toCol = move.to.col;

        this.updateStatus('Analysis complete');

        // Add highlight to best move squares
        this.highlightBestMove(move.from.row, move.from.col, move.to.row, move.to.col);
    }

    highlightBestMove(fromRow, fromCol, toRow, toCol) {
        // Remove previous highlights
        document.querySelectorAll('.best-move-highlight').forEach(el => {
            el.classList.remove('best-move-highlight');
        });

        // Add highlights
        const fromSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const toSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        
        if (fromSquare) fromSquare.classList.add('best-move-highlight');
        if (toSquare) toSquare.classList.add('best-move-highlight');
    }

    updateStatus(message) {
        const status = document.getElementById('analysis-status');
        if (status) {
            status.textContent = message;
        }
    }

    stop() {
        this.isAnalyzing = false;
    }
}

// Global engine instance (will be initialized by UI)
let chessEngine = null;

