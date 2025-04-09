import React, { useEffect, useState } from "react";
import api from "../api";
import "./Dashboard.css";

type Finance = {
  id: string;
  description: string;
  amount: number;
  typeFinances: "RECEITA" | "DESPESA";
  status?: "PAGO" | "PENDENTE" | "ATRASADO" | null;
};

const Dashboard: React.FC = () => {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"RECEITA" | "DESPESA" | null>(null);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [newFinance, setNewFinance] = useState({
    description: "",
    amount: 0,
    typeFinances: "RECEITA" as const,
    status: null as "PAGO" | "PENDENTE" | "ATRASADO" | null,
  });

  // Estados para o modal de confirmação de deleção
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [financeToDelete, setFinanceToDelete] = useState<Finance | null>(null);

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const response = await api.get("/finances/user");
      setFinances(response.data);
    } catch (error) {
      console.error("Erro ao buscar finances", error);
    }
  };

  const totalReceitas = finances
    .filter(f => f.typeFinances === "RECEITA")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalDespesas = finances
    .filter(f => f.typeFinances === "DESPESA")
    .reduce((sum, f) => sum + f.amount, 0);

  const balanco = totalReceitas - totalDespesas;

  const handleOpenModal = (type: "RECEITA" | "DESPESA") => {
    if (type === "DESPESA") {
      // Ao adicionar uma nova despesa, define status como "PENDENTE" automaticamente
      setNewFinance({ description: "", amount: 0, typeFinances: type, status: "PENDENTE" });
    } else {
      setNewFinance({ description: "", amount: 0, typeFinances: type, status: null });
    }
    setModalType(type);
    setEditingFinance(null);
    setShowModal(true);
  };

  const handleCreateOrUpdateFinance = async () => {
    try {
      if (editingFinance) {
        await api.put(`/finances/${editingFinance.id}`, newFinance);
      } else {
        await api.post("/finances", newFinance);
      }
      setShowModal(false);
      fetchFinances();
    } catch (error) {
      console.error("Erro ao salvar finance", error);
    }
  };

  const handleEditFinance = (finance: Finance) => {
    setEditingFinance(finance);
    setNewFinance({
      description: finance.description,
      amount: finance.amount,
      typeFinances: finance.typeFinances,
      status: finance.status ?? null,
    });
    setModalType(finance.typeFinances);
    setShowModal(true);
  };

  // Abre modal de confirmação de deleção
  const handleOpenDeleteModal = (finance: Finance) => {
    setFinanceToDelete(finance);
    setShowDeleteModal(true);
  };

  // Confirma deleção
  const handleConfirmDelete = async () => {
    if (financeToDelete) {
      try {
        await api.delete(`/finances/${financeToDelete.id}`);
        setShowDeleteModal(false);
        setFinanceToDelete(null);
        fetchFinances();
      } catch (error) {
        console.error("Erro ao deletar finance", error);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFinanceToDelete(null);
  };

  // Formata o valor para exibir como moeda no input (ex: R$ 10,00)
  const formatCurrencyInput = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função que trata a mudança do input de valor
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove tudo que não for dígito
    const numericString = rawValue.replace(/\D/g, "");
    const parsedValue = parseFloat(numericString) / 100;
    setNewFinance({ ...newFinance, amount: isNaN(parsedValue) ? 0 : parsedValue });
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">DASHBOARD FINANCEIRO</h1>

      <div className="resumo-container">
        <div className="resumo-item">
          <span>Receitas:</span>
          <span className="receita">{formatCurrencyInput(totalReceitas)}</span>
        </div>
        <div className="resumo-item">
          <span>Despesas:</span>
          <span className="despesa">{formatCurrencyInput(totalDespesas)}</span>
        </div>
        <div className="resumo-item">
          <span>Balanço:</span>
          <span className={balanco >= 0 ? "receita" : "despesa"}>
            {formatCurrencyInput(balanco)}
          </span>
        </div>
      </div>

      <div className="buttons-container">
        <button className="button-receita" onClick={() => handleOpenModal("RECEITA")}>
          + Receita
        </button>
        <button className="button-despesa" onClick={() => handleOpenModal("DESPESA")}>
          + Despesa
        </button>
      </div>

      <div className="tables-container">
        <div className="finance-table receitas-table">
          <div className="table-header">Receitas</div>
          <div className="table-subheader">
            <span className="header-cell description">Descrição</span>
            <span className="header-cell amount">Valor</span>
            <span className="header-cell status"></span>
            <span className="header-cell action">Ações</span>
          </div>
          {finances
            .filter(f => f.typeFinances === "RECEITA")
            .map((finance) => (
              <div key={finance.id} className="table-row">
                <div className="row-item description">{finance.description}</div>
                <div className="row-item amount receita">
                  {formatCurrencyInput(finance.amount)}
                </div>
                <div className="row-item status"></div>
                <div className="row-item action">
                  <button onClick={() => handleEditFinance(finance)}>Editar</button>
                  <button onClick={() => handleOpenDeleteModal(finance)}>Deletar</button>
                </div>
              </div>
            ))}
        </div>

        <div className="finance-table despesas-table">
          <div className="table-header">Despesas</div>
          <div className="table-subheader">
            <span className="header-cell description">Descrição</span>
            <span className="header-cell amount">Valor</span>
            <span className="header-cell status">Status Pgto.</span>
            <span className="header-cell action">Ações</span>
          </div>
          {finances
            .filter(f => f.typeFinances === "DESPESA")
            .map((finance) => (
              <div key={finance.id} className="table-row">
                <div className="row-item description">{finance.description}</div>
                <div className="row-item amount despesa">
                  {formatCurrencyInput(finance.amount)}
                </div>
                <div className="row-item status">{finance.status}</div>
                <div className="row-item action">
                  <button onClick={() => handleEditFinance(finance)}>Editar</button>
                  <button onClick={() => handleOpenDeleteModal(finance)}>Deletar</button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className={`modal ${modalType === "DESPESA" ? "modal-despesa" : "modal-receita"}`}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <h3>{editingFinance ? "Editar" : "Cadastrar"} {modalType === "RECEITA" ? "Receita" : "Despesa"}</h3>
            <input
              type="text"
              placeholder="Descrição"
              value={newFinance.description}
              onChange={(e) => setNewFinance({ ...newFinance, description: e.target.value })}
            />
            <input
              type="text"
              placeholder="Valor"
              value={newFinance.amount ? formatCurrencyInput(newFinance.amount) : ""}
              onChange={handleCurrencyChange}
            />
            {/* Exibe o select de status somente na edição de despesa */}
            {modalType === "DESPESA" && editingFinance && (
              <select
                value={newFinance.status || ""}
                onChange={(e) =>
                  setNewFinance({ ...newFinance, status: e.target.value as "PAGO" | "PENDENTE" | "ATRASADO" })
                }
              >
                <option value="PAGO">Pago</option>
                <option value="PENDENTE">Pendente</option>
                <option value="ATRASADO">Atrasado</option>
              </select>
            )}
            <div className="modal-buttons">
              <button className="modal-cancel" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className={`modal-confirm ${modalType === "RECEITA" ? "confirm-receita" : "confirm-despesa"}`}
                onClick={handleCreateOrUpdateFinance}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && financeToDelete && (
        <div className="modal-overlay">
          <div className="modal modal-delete">
            <h3>
              {`Você está excluindo essa ${
                financeToDelete.typeFinances === "DESPESA" ? "despesa" : "receita"
              }. Prosseguir?`}
            </h3>
            <div className="modal-buttons">
              <button className="modal-cancel" onClick={handleCancelDelete}>
                Cancelar
              </button>
              <button className="modal-confirm" onClick={handleConfirmDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
