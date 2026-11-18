import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'archive', 'UCI_Credit_Card.csv')

def load_raw_dataset(data_path=DATA_PATH):
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset file not found at {data_path}")
    return pd.read_csv(data_path)

def preprocess_data(df):
    df = df.copy()
    
    if 'default.payment.next.month' in df.columns:
        df = df.rename(columns={'default.payment.next.month': 'default_label'})

    df['EDUCATION'] = df['EDUCATION'].apply(lambda x: x if x in [1, 2, 3, 4] else 4)
    df['MARRIAGE'] = df['MARRIAGE'].apply(lambda x: x if x in [1, 2, 3] else 3)

    df['CREDIT_UTILIZATION'] = df['BILL_AMT1'] / (df['LIMIT_BAL'] + 1e-5)
    df['CREDIT_UTILIZATION'] = df['CREDIT_UTILIZATION'].clip(0, 3.0)

    avg_bill = df[['BILL_AMT1', 'BILL_AMT2', 'BILL_AMT3', 'BILL_AMT4', 'BILL_AMT5', 'BILL_AMT6']].mean(axis=1)
    avg_pay = df[['PAY_AMT1', 'PAY_AMT2', 'PAY_AMT3', 'PAY_AMT4', 'PAY_AMT5', 'PAY_AMT6']].mean(axis=1)
    df['AVG_PAYMENT_RATIO'] = (avg_pay / (avg_bill.abs() + 1e-5)).clip(0, 2.0)

    pay_cols = ['PAY_0', 'PAY_2', 'PAY_3', 'PAY_4', 'PAY_5', 'PAY_6']
    df['DELINQUENCY_INDEX'] = df[pay_cols].map(lambda x: max(0, x)).sum(axis=1)

    base_score = 720
    delinquency_penalty = df['DELINQUENCY_INDEX'] * 32
    utilization_penalty = df['CREDIT_UTILIZATION'] * 80
    df['TRADITIONAL_SCORE'] = (base_score - delinquency_penalty - utilization_penalty).clip(300, 850).astype(int)

    return df

def get_train_test_split(df, target_col='default_label', test_size=0.2, random_state=42):
    feature_cols = [c for c in df.columns if c not in ['ID', target_col]]
    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=feature_cols, index=X_train.index)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=feature_cols, index=X_test.index)

    return X_train, X_test, X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_cols
