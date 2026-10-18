.PHONY: install test build run-backend run-frontend demo clean

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

test:
	cd backend && pytest tests/test_aegisz.py -v

build:
	cd frontend && npm run build

run-backend:
	cd backend && python main.py

run-frontend:
	cd frontend && npm run dev

demo:
	@echo "=========================================================="
	@echo "AegisZ: Zero-Knowledge Confidential AI Gateway (IBM Z)"
	@echo "Running Automated End-to-End System Verification..."
	@echo "=========================================================="
	cd backend && pytest tests/test_aegisz.py -v
	cd frontend && npm run build
	@echo "All subsystems verified! Ready for live demonstration."

clean:
	rm -rf backend/__pycache__ backend/artifacts/*.joblib frontend/dist
