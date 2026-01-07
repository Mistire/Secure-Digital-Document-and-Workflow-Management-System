
def get_var(data, var_path):
    if not isinstance(var_path, str):
        return None
    
    parts = var_path.split('.')
    curr = data
    try:
        for p in parts:
            if isinstance(curr, dict):
                curr = curr.get(p)
            elif hasattr(curr, p):
                curr = getattr(curr, p)
            else:
                return None
        return curr
    except Exception:
        return None

def apply(logic, data):
    # Literal values
    if not isinstance(logic, dict):
        return logic
    
    # Operator
    if not logic:
        return logic
        
    op = list(logic.keys())[0]
    value = logic[op]
    
    # Operations
    if op == 'var':
        path = value if isinstance(value, str) else value[0] # Handle ["a"] or "a"
        default = value[1] if isinstance(value, list) and len(value) > 1 else None
        res = get_var(data, path)
        return res if res is not None else default

    if op == '==':
        return apply(value[0], data) == apply(value[1], data)
        
    if op == '!=':
        return apply(value[0], data) != apply(value[1], data)
        
    if op == '>':
        return apply(value[0], data) > apply(value[1], data)
        
    if op == '>=':
        return apply(value[0], data) >= apply(value[1], data)
        
    if op == '<':
        return apply(value[0], data) < apply(value[1], data)
        
    if op == '<=':
        return apply(value[0], data) <= apply(value[1], data)
        
    if op == 'and':
        return all(apply(v, data) for v in value)
        
    if op == 'or':
        return any(apply(v, data) for v in value)

    if op == '!':
        return not apply(value, data) # '!' takes single arg usually, logic={'!': [rule]} or {'!': rule}

    return False
