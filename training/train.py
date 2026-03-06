"""
training/train.py — FR-10: LoRA Fine-Tuning Pipeline for mT5-small.

Run this on Google Colab T4 GPU (free tier) after preparing your dataset.

Usage:
    # 1. Upload this file + dataset.json to Colab
    # 2. Run:  pip install transformers peft datasets sentencepiece rouge-score
    # 3. Run:  python train.py
    # 4. Download training/output/  → copy contents to backend/models/mt5_lora_merged/

Dataset format (training/dataset.json):
    [
        {
          "input":  "enhance prompt: make a website for my shop",
          "target": "Design a responsive e-commerce website..."
        },
        {
          "input":  "prompt sudharo: meri dukaan ke liye website banao",
          "target": "Ek responsive e-commerce website design karo..."
        },
        ...
    ]




Minimum 400 pairs (300 EN + 300 HI). Aim for 600+.
For cross-lingual support (FR-30): include 50+ cross-lingual pairs.
"""

import json
import os
import logging
from dataclasses import dataclass

import torch
from datasets import Dataset
from peft import LoraConfig, TaskType, get_peft_model
from rouge_score import rouge_scorer
from transformers import (
    MT5ForConditionalGeneration,
    T5Tokenizer,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    DataCollatorForSeq2Seq,
    EarlyStoppingCallback,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────── Configuration ────────────────────────────────────

@dataclass
class TrainConfig:
    base_model: str = "google/mt5-small"
    dataset_path: str = "training/dataset.json"
    output_dir: str = "training/output"
    num_epochs: int = 15
    batch_size: int = 8
    learning_rate: float = 3e-4
    max_input_length: int = 128
    max_target_length: int = 200
    validation_split: float = 0.1     # 10% held out (NF-T2)
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.1
    rouge_threshold: float = 0.35     # Minimum ROUGE-L (R-01)
    seed: int = 42


cfg = TrainConfig()


# ─────────────────────────── Dataset loading ──────────────────────────────────

def load_dataset(path: str) -> tuple[Dataset, Dataset]:
    """Load and split dataset into train and validation sets."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    logger.info("Loaded %d training pairs from %s", len(data), path)

    if len(data) < 400:
        logger.warning(
            "⚠️  Only %d pairs found. Minimum 400 required (SRS §2.5 C6). "
            "Generate more pairs before submitting.",
            len(data),
        )

    # Shuffle and split
    import random
    random.seed(cfg.seed)
    random.shuffle(data)

    split = int(len(data) * (1 - cfg.validation_split))
    train_data = data[:split]
    val_data = data[split:]

    logger.info("Train: %d  |  Validation: %d", len(train_data), len(val_data))
    return Dataset.from_list(train_data), Dataset.from_list(val_data)


# ─────────────────────────── Tokenization ────────────────────────────────────

def tokenize_fn(batch, tokenizer: T5Tokenizer) -> dict:
    """Tokenize (input, target) pairs for Seq2Seq training."""
    model_inputs = tokenizer(
        batch["input"],
        max_length=cfg.max_input_length,
        truncation=True,
        padding="max_length",
    )
    labels = tokenizer(
        text_target=batch["target"],
        max_length=cfg.max_target_length,
        truncation=True,
        padding="max_length",
    )
    # Replace padding token id in labels with -100 so loss ignores them
    labels["input_ids"] = [
        [(l if l != tokenizer.pad_token_id else -100) for l in label]
        for label in labels["input_ids"]
    ]
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs


# ─────────────────────────── LoRA setup ───────────────────────────────────────

def apply_lora(model: MT5ForConditionalGeneration) -> MT5ForConditionalGeneration:
    """
    Apply LoRA adapter to mT5-small (FR-10, C5).

    Target modules verified via model.named_modules() — mT5 uses 'q' and 'v'
    for attention queries/values in both encoder and decoder (R-05).
    """
    lora_config = LoraConfig(
        task_type=TaskType.SEQ_2_SEQ_LM,
        r=cfg.lora_r,
        lora_alpha=cfg.lora_alpha,
        lora_dropout=cfg.lora_dropout,
        target_modules=["q", "v"],
        bias="none",
    )
    peft_model = get_peft_model(model, lora_config)
    peft_model.print_trainable_parameters()
    return peft_model


# ─────────────────────────── Evaluation ──────────────────────────────────────

def compute_rouge_l(
    model: MT5ForConditionalGeneration,
    tokenizer: T5Tokenizer,
    val_dataset: Dataset,
    num_samples: int = 40,
) -> dict[str, float]:
    """
    Evaluate model ROUGE-L on validation set (NF-T2).

    Also computes identity baseline (raw input as enhanced output).
    """
    scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)
    model_scores: list[float] = []
    baseline_scores: list[float] = []

    samples = val_dataset.select(range(min(num_samples, len(val_dataset))))

    model.eval()
    with torch.no_grad():
        for sample in samples:
            inputs = tokenizer(
                sample["input"],
                return_tensors="pt",
                max_length=cfg.max_input_length,
                truncation=True,
            )
            output_ids = model.generate(
                input_ids=inputs["input_ids"],
                num_beams=4,
                max_new_tokens=cfg.max_target_length,
                early_stopping=True,
            )
            prediction = tokenizer.decode(output_ids[0], skip_special_tokens=True)
            reference = sample["target"]
            raw_input = sample["input"]

            model_scores.append(scorer.score(reference, prediction)["rougeL"].fmeasure)
            baseline_scores.append(scorer.score(reference, raw_input)["rougeL"].fmeasure)

    avg_model = sum(model_scores) / len(model_scores)
    avg_baseline = sum(baseline_scores) / len(baseline_scores)

    logger.info("ROUGE-L — Model: %.4f  |  Baseline (identity): %.4f", avg_model, avg_baseline)
    if avg_model < cfg.rouge_threshold:
        logger.warning(
            "⚠️  ROUGE-L %.4f is below the required threshold of %.2f (R-01). "
            "Consider augmenting the training dataset.",
            avg_model, cfg.rouge_threshold,
        )
    return {"model_rougeL": avg_model, "baseline_rougeL": avg_baseline}


# ─────────────────────────── Main training loop ───────────────────────────────

def main():
    os.makedirs(cfg.output_dir, exist_ok=True)

    # Load tokenizer + base model
    logger.info("Loading base model: %s", cfg.base_model)
    tokenizer = T5Tokenizer.from_pretrained(cfg.base_model)
    base_model = MT5ForConditionalGeneration.from_pretrained(
        cfg.base_model,
        torch_dtype=torch.float32,
    )

    # Apply LoRA
    model = apply_lora(base_model)

    # Load and tokenize dataset
    train_ds, val_ds = load_dataset(cfg.dataset_path)
    train_tok = train_ds.map(
        lambda b: tokenize_fn(b, tokenizer),
        batched=True,
        remove_columns=["input", "target"],
    )
    val_tok = val_ds.map(
        lambda b: tokenize_fn(b, tokenizer),
        batched=True,
        remove_columns=["input", "target"],
    )

    # Training arguments
    training_args = Seq2SeqTrainingArguments(
        output_dir=cfg.output_dir,
        num_train_epochs=cfg.num_epochs,
        per_device_train_batch_size=cfg.batch_size,
        per_device_eval_batch_size=cfg.batch_size,
        learning_rate=cfg.learning_rate,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        predict_with_generate=False,  # Using loss for checkpointing
        logging_steps=50,
        seed=cfg.seed,
        fp16=False,   # float32 (CPU compat, R-02)
        report_to="none",
        dataloader_num_workers=0,  # Safe for Colab
    )

    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model, padding=True)

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_tok,
        eval_dataset=val_tok,
        tokenizer=tokenizer,
        data_collator=data_collator,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
    )

    # Train
    logger.info("Starting training for %d epochs ...", cfg.num_epochs)
    trainer.train()

    # Merge LoRA weights into base model + save
    logger.info("Merging LoRA adapter into base model ...")
    merged_model = model.merge_and_unload()
    merged_model.save_pretrained(cfg.output_dir)
    tokenizer.save_pretrained(cfg.output_dir)
    logger.info("✅ Saved merged model to %s", cfg.output_dir)

    # ROUGE-L evaluation (NF-T2)
    scores = compute_rouge_l(merged_model, tokenizer, val_ds)
    with open(os.path.join(cfg.output_dir, "rouge_results.json"), "w") as f:
        json.dump(scores, f, indent=2)
    logger.info("Saved ROUGE-L results to %s/rouge_results.json", cfg.output_dir)

    logger.info(
        "\n\n✅ Training complete!\n"
        "Next steps:\n"
        "  1. Download training/output/ from Colab\n"
        "  2. Copy contents to backend/models/mt5_lora_merged/\n"
        "  3. Restart uvicorn — real inference mode will activate automatically\n"
    )


if __name__ == "__main__":
    main()
