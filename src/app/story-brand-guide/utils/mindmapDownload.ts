/**
 * 마인드맵 다운로드 유틸리티
 * 완성된 스토리브랜드 결과를 Canvas로 그려서 이미지로 다운로드합니다.
 */

import { StoryData } from '../types';
import { CATEGORIES, MINDMAP_CONFIG } from '../constants';

/**
 * 마인드맵을 Canvas로 그려서 PNG 이미지로 다운로드
 * @param storyData 사용자가 입력한 스토리 데이터
 * @param selectedCategory 선택된 카테고리 ID
 */
export const downloadMindmap = (storyData: StoryData, selectedCategory: string) => {
  // Canvas 요소 생성
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Canvas context를 가져올 수 없습니다.');
    return;
  }

  // Canvas 크기 설정
  canvas.width = MINDMAP_CONFIG.CANVAS_WIDTH;
  canvas.height = MINDMAP_CONFIG.CANVAS_HEIGHT;

  // 배경 그리기
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 선택된 카테고리 정보 가져오기
  const category = CATEGORIES.find(c => c.id === selectedCategory);
  
  // 제목 그리기
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('내 스토리 마인드맵', canvas.width / 2, 50);
  
  // 카테고리 제목 그리기
  ctx.font = '16px Arial';
  ctx.fillText(`영역: ${category?.name || ''}`, canvas.width / 2, 80);

  // 각 단계별 박스 그리기
  const stepBoxes = MINDMAP_CONFIG.STEP_BOXES.map((box, index) => ({
    ...box,
    content: storyData[`step${index + 1}` as keyof StoryData] as string
  }));

  stepBoxes.forEach((box) => {
    // 박스 배경 그리기
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(box.x - box.width/2, box.y - box.height/2, box.width, box.height);
    
    // 박스 테두리 그리기
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(box.x - box.width/2, box.y - box.height/2, box.width, box.height);
    
    // 박스 제목 그리기
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(box.title, box.x, box.y - 10);
    
    // 박스 내용 그리기 (길이 제한)
    ctx.font = '10px Arial';
    const shortContent = box.content.length > 30 ? 
      box.content.substring(0, 30) + '...' : 
      box.content;
    ctx.fillText(shortContent, box.x, box.y + 10);
  });

  // 연결선 그리기
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  
  MINDMAP_CONFIG.CONNECTIONS.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  // 이미지 다운로드
  const link = document.createElement('a');
  link.download = `스토리브랜드_마인드맵_${category?.name || 'unknown'}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 텍스트 길이에 따라 적절히 줄바꿈하는 함수
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @returns 줄바꿈된 텍스트 배열
 */
export const wrapText = (text: string, maxLength: number = 25): string[] => {
  if (!text) return [''];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
};

/**
 * 긴 텍스트를 요약하는 함수
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @returns 요약된 텍스트
 */
export const getSummary = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  
  // 첫 문장 또는 최대 길이까지만 표시
  const sentences = text.split(/[.!?]\s+/);
  let summary = sentences[0];
  
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...';
  }
  
  return summary;
}; 