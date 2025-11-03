import { useState } from 'react';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export function useRelatoriosPDF() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function gerarRelatorioVisita(visitaId: string, organizationId: string) {
    setGenerating(true);
    setError(null);

    try {
      // Buscar dados da visita via edge function
      const { data, error: fetchError } = await supabase.functions.invoke('gerar-dados-relatorio', {
        body: {
          visitaId,
          organizationId,
          tipoRelatorio: 'completo',
        },
      });

      if (fetchError) throw fetchError;

      const relatorio = data.data.relatorio;

      // Criar PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Cabeçalho
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório de Visita Técnica', margin, y);
      y += 15;

      // Informações da Organização
      if (relatorio.organizacao) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(relatorio.organizacao.nome, margin, y);
        y += 5;
        if (relatorio.organizacao.email) {
          pdf.text(`Email: ${relatorio.organizacao.email}`, margin, y);
          y += 5;
        }
        y += 5;
      }

      // Linha separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Informações da Visita
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(relatorio.informacoes.titulo, margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Data: ${new Date(relatorio.informacoes.dataVisita).toLocaleDateString('pt-BR')}`, margin, y);
      y += 5;
      
      if (relatorio.informacoes.horaInicio && relatorio.informacoes.horaFim) {
        pdf.text(`Horário: ${relatorio.informacoes.horaInicio} às ${relatorio.informacoes.horaFim}`, margin, y);
        y += 5;
      }

      if (relatorio.informacoes.tipoVisita) {
        pdf.text(`Tipo: ${relatorio.informacoes.tipoVisita}`, margin, y);
        y += 5;
      }
      y += 5;

      // Cliente
      if (relatorio.cliente) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Cliente', margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(relatorio.cliente.nome, margin, y);
        y += 5;
        if (relatorio.cliente.telefone) {
          pdf.text(`Telefone: ${relatorio.cliente.telefone}`, margin, y);
          y += 5;
        }
        y += 5;
      }

      // Fazenda
      if (relatorio.fazenda) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Fazenda', margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(relatorio.fazenda.nome, margin, y);
        y += 5;
        if (relatorio.fazenda.areaTotal) {
          pdf.text(`Área: ${relatorio.fazenda.areaTotal} ${relatorio.fazenda.unidadeArea}`, margin, y);
          y += 5;
        }
        y += 5;
      }

      // Técnico
      if (relatorio.tecnico && relatorio.tecnico.nome) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Técnico Responsável', margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(relatorio.tecnico.nome, margin, y);
        y += 5;
        y += 5;
      }

      // Nova página para conteúdo
      pdf.addPage();
      y = margin;

      // Objetivo
      if (relatorio.conteudo.objetivo) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Objetivo', margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const objetivoLines = pdf.splitTextToSize(relatorio.conteudo.objetivo, pageWidth - 2 * margin);
        pdf.text(objetivoLines, margin, y);
        y += objetivoLines.length * 5 + 5;
      }

      // Resumo
      if (relatorio.conteudo.resumo) {
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Resumo da Visita', margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const resumoLines = pdf.splitTextToSize(relatorio.conteudo.resumo, pageWidth - 2 * margin);
        pdf.text(resumoLines, margin, y);
        y += resumoLines.length * 5 + 5;
      }

      // Recomendações
      if (relatorio.conteudo.recomendacoes) {
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Recomendações Técnicas', margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const recLines = pdf.splitTextToSize(relatorio.conteudo.recomendacoes, pageWidth - 2 * margin);
        pdf.text(recLines, margin, y);
        y += recLines.length * 5 + 5;
      }

      // Próximos Passos
      if (relatorio.conteudo.proximosPassos) {
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Próximos Passos', margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const passosLines = pdf.splitTextToSize(relatorio.conteudo.proximosPassos, pageWidth - 2 * margin);
        pdf.text(passosLines, margin, y);
        y += passosLines.length * 5 + 5;
      }

      // Estatísticas
      if (relatorio.estatisticas) {
        if (y > pageHeight - 50) {
          pdf.addPage();
          y = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Estatísticas', margin, y);
        y += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total de Atividades: ${relatorio.estatisticas.totalAtividades}`, margin, y);
        y += 5;
        pdf.text(`Total de Fotos: ${relatorio.estatisticas.totalFotos}`, margin, y);
        y += 5;
        pdf.text(`Total de Levantamentos: ${relatorio.estatisticas.totalLevantamentos}`, margin, y);
        y += 5;
      }

      // Rodapé
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
          margin,
          pageHeight - 10
        );
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
      }

      // Salvar PDF
      const fileName = `relatorio-visita-${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
      throw err;
    } finally {
      setGenerating(false);
    }
  }

  return {
    gerarRelatorioVisita,
    generating,
    error,
  };
}
