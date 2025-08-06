#!/usr/bin/env python3
import os
import re
import json
from pathlib import Path

def find_all_imports(src_dir):
    """查找所有import语句并分析缺失文件"""
    imports = []
    missing_files = []
    
    # 正则表达式匹配import语句
    import_patterns = [
        r"import\s+.*\s+from\s+['\"]([^'\"]+)['\"]",
        r"import\s+['\"]([^'\"]+)['\"]",
        r"component:\s*\(\)\s*=>\s*import\s*\(['\"]([^'\"]+)['\"]\)",
        r"src=['\"](@/[^'\"]+)['\"]",
        r"require\s*\(['\"]([^'\"]+)['\"]\)"
    ]
    
    for root, dirs, files in os.walk(src_dir):
        # 跳过node_modules
        if 'node_modules' in root:
            continue
            
        for file in files:
            if file.endswith(('.js', '.vue', '.ts')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for pattern in import_patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        imports.append({
                            'file': filepath,
                            'import': match
                        })
    
    # 分析导入路径
    for imp in imports:
        import_path = imp['import']
        
        # 处理别名
        if import_path.startswith('@/'):
            import_path = import_path.replace('@/', 'src/')
        
        # 跳过外部包
        if import_path.startswith(('vue', 'element-plus', '@element-plus', 'pinia', 'axios', 'dayjs', '@vueuse', 'echarts', 'marked', 'dompurify', 'nprogress')):
            continue
        
        # 相对路径处理
        if import_path.startswith('./') or import_path.startswith('../'):
            base_dir = os.path.dirname(imp['file'])
            import_path = os.path.normpath(os.path.join(base_dir, import_path))
        
        # 检查文件是否存在
        possible_paths = [
            import_path,
            import_path + '.js',
            import_path + '.vue',
            import_path + '.ts',
            import_path + '/index.js',
            import_path + '/index.vue',
            import_path + '/index.ts'
        ]
        
        exists = False
        for path in possible_paths:
            if os.path.exists(path):
                exists = True
                break
        
        if not exists and not import_path.endswith(('.css', '.scss', '.png', '.jpg', '.svg', '.gif')):
            missing_files.append({
                'imported_in': imp['file'],
                'missing_file': import_path,
                'original_import': imp['import']
            })
    
    return imports, missing_files

def analyze_assets():
    """分析资源文件引用"""
    asset_patterns = [
        (r"@/assets/images/([^'\"]+)", 'src/assets/images/'),
        (r"@/assets/styles/([^'\"]+)", 'src/assets/styles/'),
        (r"@/assets/fonts/([^'\"]+)", 'src/assets/fonts/'),
    ]
    
    missing_assets = []
    
    for root, dirs, files in os.walk('src'):
        if 'node_modules' in root:
            continue
            
        for file in files:
            if file.endswith(('.js', '.vue', '.scss', '.css')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for pattern, base_path in asset_patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        asset_path = base_path + match
                        if not os.path.exists(asset_path):
                            missing_assets.append({
                                'file': filepath,
                                'asset': asset_path,
                                'type': 'image' if 'images' in asset_path else 'style' if 'styles' in asset_path else 'font'
                            })
    
    return missing_assets

def main():
    print("🔍 系统分析项目缺失文件")
    print("=" * 50)
    
    # 分析导入
    imports, missing_files = find_all_imports('src')
    
    print(f"\n📊 导入分析结果：")
    print(f"总导入数: {len(imports)}")
    print(f"缺失文件数: {len(missing_files)}")
    
    if missing_files:
        print("\n❌ 缺失的模块文件：")
        unique_missing = {}
        for mf in missing_files:
            if mf['missing_file'] not in unique_missing:
                unique_missing[mf['missing_file']] = []
            unique_missing[mf['missing_file']].append(mf['imported_in'])
        
        for missing, imported_in in unique_missing.items():
            print(f"\n  • {missing}")
            print(f"    被引用于: {', '.join(set(imported_in))}")
    
    # 分析资源文件
    missing_assets = analyze_assets()
    
    if missing_assets:
        print("\n\n❌ 缺失的资源文件：")
        asset_types = {}
        for ma in missing_assets:
            asset_type = ma['type']
            if asset_type not in asset_types:
                asset_types[asset_type] = []
            asset_types[asset_type].append(ma['asset'])
        
        for asset_type, assets in asset_types.items():
            print(f"\n  {asset_type.upper()}:")
            for asset in sorted(set(assets)):
                print(f"    • {asset}")
    
    # 生成报告
    report = {
        'total_imports': len(imports),
        'missing_modules': len(missing_files),
        'missing_assets': len(missing_assets),
        'missing_files_detail': unique_missing if missing_files else {},
        'missing_assets_detail': asset_types if missing_assets else {}
    }
    
    with open('missing_files_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print("\n\n✅ 分析完成！详细报告已保存到 missing_files_report.json")

if __name__ == '__main__':
    main()